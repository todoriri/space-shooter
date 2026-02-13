
import os
import subprocess
import signal

ports = [8081, 8082, 8083]

for port in ports:
    try:
        # Use lsof to find PIDs listening on the port
        output = subprocess.check_output(["lsof", "-t", f"-i:{port}"])
        pids = output.decode().strip().split('\n')
        
        for pid in pids:
            if pid:
                pid = int(pid)
                print(f"Killing process {pid} on port {port}")
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    print(f"Process {pid} already dead")
                except PermissionError:
                    print(f"Permission denied killing {pid}")
    except subprocess.CalledProcessError:
        print(f"No process found on port {port}")
    except Exception as e:
        print(f"Error checking port {port}: {e}")
