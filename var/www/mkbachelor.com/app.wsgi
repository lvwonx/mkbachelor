import sys
import traceback

sys.path.insert(0, "/var/www/mkbachelor.com")
sys.path.insert(0, "/var/www/mkbachelor.com/venv/lib/python3.13/site-packages")

def application(environ, start_response):
    try:
        import app
        return app.app(environ, start_response)
    except Exception:
        status = '500 Internal Server Error'
        output = traceback.format_exc().encode()

        response_headers = [('Content-type', 'text/plain')]
        start_response(status, response_headers)

        return [output]