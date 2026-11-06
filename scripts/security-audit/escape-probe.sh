#!/bin/bash
# ABOUTME: Tries each sandbox escape and reports the outcome; creates files only in scratch
# Run inside run-sandboxed.sh before trusting a new host; every line should report a refusal
echo "uid: $(id -u) caps: $(grep CapEff /proc/self/status | awk '{print $2}') nnp: $(grep NoNewPrivs /proc/self/status | awk '{print $2}')"
echo -n "remount / rw: "; (mount -o remount,rw / 2>&1 | head -1) || true
echo -n "setns host net: "; (nsenter --net=/proc/1/ns/net true 2>&1 | head -1; [ -e /proc/1/ns/net ] && echo "(pid1 here is sandbox init)") || true
echo -n "see host processes: "; ls /proc | grep -E '^[0-9]+$' | wc -l
echo -n "write /home/user: "; ( : > /home/user/.probe ) 2>&1 | head -1
echo -n "write /var/tmp: "; ( : > /var/tmp/.probe ) 2>&1 | head -1
echo -n "write /dev/shm: "; ( : > /dev/shm/.probe ) 2>&1 | head -1
echo -n "read /root: "; (ls /root/.ccr 2>&1 | head -1)
echo -n "read audit-target: "; ls /home/user/audit-target/package.json
echo -n "read /root/.ccr: "; (ls /root/.ccr 2>&1 | head -1)
echo -n "raise nproc limit: "; (prlimit --pid $$ --nproc=100000 2>&1 | head -1) || true; echo "now $(ulimit -u)"
echo -n "scratch write: "; ( : > "$HOME/ok" ) && echo ok
echo -n "scratch disk cap: "; (head -c 70000000 /dev/zero > "$HOME/fill" 2>&1 | head -1); ls -l "$HOME/fill" | awk '{print $5" bytes written"}'
echo -n "network: "; (getent hosts example.com >/dev/null && echo REACHABLE) || echo none
echo -n "leave cgroup: "; (echo $$ > /sys/fs/cgroup/memory/cgroup.procs) 2>&1 | head -1
