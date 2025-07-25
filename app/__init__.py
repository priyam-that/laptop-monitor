from flask import Flask
import os

def create_app():
    # Get the directory containing the run.py file (project root)
    template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates'))
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))
    
    app = Flask(__name__, 
                template_folder=template_dir,
                static_folder=static_dir)
    
    # Import and register routes
    from app.routes import bp as main_bp
    app.register_blueprint(main_bp)
    
    return app
