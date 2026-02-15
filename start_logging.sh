#!/bin/bash
# start_logging.sh
# Starts capturing both Android system logs (adb logcat) and Metro Bundler logs
# to files in the temp_logs directory.

mkdir -p temp_logs

echo "Starting log capture..."
echo "Output files:"
echo "  - temp_logs/android_logcat.txt (System logs & Native crashes)"
echo "  - temp_logs/npx_expo.log (JS Console logs & Errors)"

# Clear old logs
echo "" > temp_logs/android_logcat.txt
echo "" > temp_logs/npx_expo.log

# Function to cleanup ADB process on exit
cleanup() {
    if [ ! -z "$ADBPID" ]; then
        echo "Stopping ADB Logcat (PID: $ADBPID)..."
        kill $ADBPID 2>/dev/null
    fi
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM INT EXIT

# Start ADB Logcat in background
adb logcat -v time *:V > temp_logs/android_logcat.txt &
ADBPID=$!
echo "ADB Logcat started (PID: $ADBPID)"

# Start Metro Bundler
echo "Starting Metro Bundler (Press Ctrl+C to stop both logs)..."
# Use npx expo start -c (clear cache)
npx expo start -c | tee -a temp_logs/npx_expo.log
