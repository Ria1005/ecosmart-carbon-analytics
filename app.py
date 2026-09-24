from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/transport')
def transport():
    return render_template('transport.html')


@app.route('/recycling')
def recycling():
    return render_template('recycling.html')


@app.route('/insights')
def insights():
    return render_template('insights.html')


@app.route('/predict')
def predict():
    return render_template('predict.html')


@app.route('/about')
def about():
    return render_template('about.html')


if __name__ == '__main__':
    app.run(debug=True, port=5000)