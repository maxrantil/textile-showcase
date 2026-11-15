#!/usr/bin/env python3
# ABOUTME: Trusted parent-side artifact promotion for the security-audit skill.
# Copies allowlisted scratch-relative files into artifacts/ with no-follow, descriptor-relative
# traversal, regular-file + link-count checks, exclusive creation and per-file/total byte bounds.
# Usage: promote.py <scratch-root> <artifacts-root> <max-file-bytes> <max-total-bytes> <rel>...
import os
import stat
import sys

DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC


def components(rel):
    if not rel or os.path.isabs(rel):
        raise ValueError(f"absolute or empty path: {rel!r}")
    parts = rel.split("/")
    for p in parts:
        if p in ("", ".", ".."):
            raise ValueError(f"invalid component in {rel!r}")
    return parts


def walk_dirs(root_fd, parts, create):
    """Walk directory components from root_fd without following links."""
    fd = os.dup(root_fd)
    try:
        for part in parts:
            try:
                nxt = os.open(part, DIR_FLAGS, dir_fd=fd)
            except FileNotFoundError:
                if not create:
                    raise
                os.mkdir(part, 0o700, dir_fd=fd)  # fails if it appeared meanwhile
                nxt = os.open(part, DIR_FLAGS, dir_fd=fd)
            st = os.fstat(nxt)
            if not stat.S_ISDIR(st.st_mode):
                os.close(nxt)
                raise ValueError(f"not a directory: {part!r}")
            os.close(fd)
            fd = nxt
        return fd
    except Exception:
        os.close(fd)
        raise


def promote_one(src_root, dst_root, rel, max_file, budget):
    parts = components(rel)
    sdir = walk_dirs(src_root, parts[:-1], create=False)
    try:
        sfd = os.open(parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_NOCTTY | os.O_CLOEXEC, dir_fd=sdir)
    finally:
        os.close(sdir)
    try:
        st = os.fstat(sfd)
        if not stat.S_ISREG(st.st_mode) or st.st_nlink != 1:
            raise ValueError(f"{rel}: not a single-link regular file")
        if st.st_size > max_file or st.st_size > budget:
            raise ValueError(f"{rel}: {st.st_size} bytes exceeds bound")
        data = b""
        while len(data) <= st.st_size:
            chunk = os.read(sfd, min(65536, st.st_size + 1 - len(data)))
            if not chunk:
                break
            data += chunk
        st2 = os.fstat(sfd)
        if len(data) != st.st_size or (st2.st_ino, st2.st_dev, st2.st_size, st2.st_nlink, st2.st_mode) != (
            st.st_ino, st.st_dev, st.st_size, st.st_nlink, st.st_mode
        ):
            raise ValueError(f"{rel}: changed during copy")
    finally:
        os.close(sfd)

    ddir = walk_dirs(dst_root, parts[:-1], create=True)
    try:
        dfd = os.open(parts[-1], os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600, dir_fd=ddir)
    finally:
        os.close(ddir)
    try:
        dst = os.fstat(dfd)
        if not stat.S_ISREG(dst.st_mode) or dst.st_nlink != 1:
            raise ValueError(f"{rel}: destination not a single-link regular file")
        view = memoryview(data)
        while view:
            n = os.write(dfd, view)
            if n <= 0:
                raise OSError(f"{rel}: short write")
            view = view[n:]
    finally:
        os.close(dfd)
    return len(data)


def main():
    if len(sys.argv) < 6:
        sys.exit("usage: promote.py <scratch-root> <artifacts-root> <max-file-bytes> <max-total-bytes> <rel>...")
    scratch, artifacts, max_file, max_total = sys.argv[1:5]
    max_file, budget = int(max_file), int(max_total)
    if max_file < 0 or budget < 0:
        sys.exit("byte bounds must be non-negative")
    src_root = os.open(scratch, DIR_FLAGS)
    dst_root = os.open(artifacts, DIR_FLAGS)
    failed = False
    for rel in sys.argv[5:]:
        try:
            n = promote_one(src_root, dst_root, rel, max_file, budget)
            budget -= n
            print(f"promoted {rel} ({n} bytes)")
        except Exception as e:  # discard the entry; caller records needs_validation if decisive
            failed = True
            print(f"REJECTED {rel}: {e}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
