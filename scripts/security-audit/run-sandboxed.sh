#!/bin/bash
# ABOUTME: OS-enforced sandbox for target-controlled execution (security-audit skill rules):
# own net (loopback only), mount and PID namespaces; every mount read-only; the agent's
# size-capped tmpfs scratch bound at /tmp as the only writable path; target runs as nobody
# with all capabilities dropped and no_new_privs; empty allowlisted env; CPU/memory/process/
# file-size/fd/wall-clock limits. Refuses to run if any writable mount remains.
# Usage: run-sandboxed.sh <scratch-tmpfs> <workdir> <command> [args...]
set -uo pipefail
SCRATCH="$1"; WORKDIR="$2"; shift 2
DIR="$(cd "$(dirname "$0")" && pwd)"
[ "$(findmnt -n -o FSTYPE --mountpoint "$SCRATCH" 2>/dev/null)" = tmpfs ] \
  || { echo "sandbox: $SCRATCH is not a tmpfs mount" >&2; exit 97; }
# Aggregate memory (3 GiB, no swap) and process (512) caps via a per-run cgroup.
CG="sbx-$$"
mkdir /sys/fs/cgroup/memory/$CG /sys/fs/cgroup/pids/$CG
echo 3221225472 > /sys/fs/cgroup/memory/$CG/memory.limit_in_bytes
echo 3221225472 > /sys/fs/cgroup/memory/$CG/memory.memsw.limit_in_bytes 2>/dev/null || true
echo 512 > /sys/fs/cgroup/pids/$CG/pids.max
echo $$ > /sys/fs/cgroup/memory/$CG/cgroup.procs
echo $$ > /sys/fs/cgroup/pids/$CG/cgroup.procs

INNER='
set -euo pipefail
scratch="$1"; workdir="$2"; dir="$3"; shift 3
python3 "$dir/lo-up.py"
mount --make-rprivate /
mount -t proc -o nosuid,nodev,noexec proc /proc
mount --bind "$scratch" /tmp
mount -t tmpfs -o size=1m,mode=0755 tmpfs /dev/shm
for m in $(awk "{print \$2}" /proc/self/mounts | sort -r -u); do
  [ "$m" = /tmp ] && continue
  case "$m" in /proc|/proc/*) continue ;; esac
  mount -o remount,bind,ro "$m" 2>/dev/null || mount -o remount,ro "$m" 2>/dev/null || true
done
bad=$(awk "{o[\$2]=\$4} END {for (k in o) if (o[k] ~ /(^|,)rw(,|\$)/ && k != \"/tmp\" && k !~ /^\\/proc(\\/|\$)/) print k}" /proc/self/mounts)
if [ -n "$bad" ]; then echo "sandbox: refusing to run, writable mounts remain:" $bad >&2; exit 98; fi
cd "$workdir"
exec env -i PATH=/opt/node22/bin:/usr/local/bin:/usr/bin:/bin HOME=/tmp TMPDIR=/tmp \
  NODE_ENV=test CI=true \
  setpriv --reuid=nobody --regid=nogroup --clear-groups --no-new-privs --inh-caps=-all --bounding-set=-all -- \
  prlimit --nproc=256 --fsize=52428800 --cpu=300 --nofile=1024 -- \
  timeout -k 5 300 "$@"
'

unshare --net --mount --pid --fork bash -c "$INNER" sandbox "$SCRATCH" "$WORKDIR" "$DIR" "$@"
rc=$?
echo $$ > /sys/fs/cgroup/memory/cgroup.procs; echo $$ > /sys/fs/cgroup/pids/cgroup.procs
rmdir /sys/fs/cgroup/memory/$CG /sys/fs/cgroup/pids/$CG 2>/dev/null || true
exit $rc
