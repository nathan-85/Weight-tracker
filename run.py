from flask import Flask, send_from_directory
import os

app = Flask(
    __name__,
    static_folder='frontend/build',       # <-- point at the React build
    static_url_path=''                    # <-- serve files at root URL
)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # if the user requests /foo, serve build/foo or fallback to index.html
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # use port from $PORT or default 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
