#!/usr/bin/env python3
"""
TestTogHTML Skill Helper Script
Upload HTML files to 115.190.154.64
"""

import os
import sys
from pathlib import Path

try:
    import paramiko
except ImportError:
    print("Error: paramiko not installed. Run: pip install paramiko")
    sys.exit(1)


class TestTogHTMLUploader:
    def __init__(self):
        self.host = "115.190.154.64"
        self.user = "dev"
        self.password = "dev1110"
        self.port = 22
        self.remote_dir = "/home/dev/tmp/"
    
    def check_remote_file(self, filename):
        """Check if file exists on remote server"""
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            ssh.connect(self.host, self.port, self.user, self.password)
            stdin, stdout, stderr = ssh.exec_command(f"ls -la {self.remote_dir}{filename}")
            output = stdout.read().decode("utf-8")
            error = stderr.read().decode("utf-8")
            ssh.close()
            
            if error and "No such file or directory" in error:
                return False
            return bool(output.strip())
            
        except Exception as e:
            print(f"Error checking remote file: {e}")
            return False
    
    def upload_file(self, local_path):
        """Upload file to remote server"""
        filename = os.path.basename(local_path)
        remote_path = os.path.join(self.remote_dir, filename)
        
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            ssh.connect(self.host, self.port, self.user, self.password)
            sftp = ssh.open_sftp()
            
            # Ensure remote directory exists
            try:
                sftp.stat(self.remote_dir)
            except FileNotFoundError:
                sftp.mkdir(self.remote_dir)
            
            # Upload file
            print(f"Uploading {filename} to {self.remote_dir}...")
            sftp.put(local_path, remote_path)
            
            # Verify upload
            stat = sftp.stat(remote_path)
            print(f"Upload successful! File size: {stat.st_size} bytes")
            
            sftp.close()
            ssh.close()
            
            return True
            
        except Exception as e:
            print(f"Error uploading file: {e}")
            return False


def main():
    if len(sys.argv) != 2:
        print("Usage: python testtoghtml_uploader.py <local_file_path>")
        sys.exit(1)
    
    local_path = sys.argv[1]
    
    if not os.path.exists(local_path):
        print(f"Error: File {local_path} does not exist")
        sys.exit(1)
    
    uploader = TestTogHTMLUploader()
    filename = os.path.basename(local_path)
    
    # Check if file exists remotely
    exists = uploader.check_remote_file(filename)
    
    if exists:
        print(f"Warning: File {filename} already exists on remote server!")
        print("Please ask user whether to overwrite or stop.")
        sys.exit(2)  # Exit with code 2 to indicate file exists
    
    # Upload file
    success = uploader.upload_file(local_path)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
