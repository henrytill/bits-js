import fcntl
import os
import signal
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

file_changes_detected = threading.Event()

watch_dir_fd = None


def file_changed_handler(signum, frame):
    global file_changes_detected
    print('File changes detected')
    file_changes_detected.set()


class MyHandler(SimpleHTTPRequestHandler):
    def handle_events(self):
        global file_changes_detected
        global watch_dir_fd

        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Connection', 'keep-alive')
        self.end_headers()

        while True:
            file_changes_detected.wait()
            file_changes_detected.clear()
            print('Sending reload event')
            self.wfile.write(b'event: reload\ndata: true\n\n')
            # Re-register the watch
            fcntl.fcntl(watch_dir_fd, fcntl.F_NOTIFY, fcntl.DN_MODIFY)

    def do_GET(self):
        if self.path == '/events':
            self.handle_events()
        else:
            super().do_GET()


def watch_files(watch_dir_path):
    global watch_dir_fd

    real_time_signal = signal.SIGRTMIN + 1
    signal.signal(real_time_signal, file_changed_handler)

    watch_dir_fd = os.open(watch_dir_path, os.O_RDONLY)
    fcntl.fcntl(watch_dir_fd, fcntl.F_SETSIG, real_time_signal)

    # DN_MULTISHOT seems to result in double-triggers, so instead we re-register
    # the watch manually after sending a reload event.
    fcntl.fcntl(watch_dir_fd, fcntl.F_NOTIFY, fcntl.DN_MODIFY)


def run(server_class=ThreadingHTTPServer, handler_class=MyHandler):
    port = 8000

    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Server running at http://localhost:{port}')

    watch_dir_path = os.getcwd()
    watch_files(watch_dir_path)
    print('Watching directory: {}'.format(watch_dir_path))

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.shutdown()
        httpd.server_close()
        os.close(watch_dir_fd)


if __name__ == '__main__':
    os.chdir('static')
    run()
