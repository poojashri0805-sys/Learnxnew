from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# 🔥 Load trained model
model = joblib.load("final_model.pkl")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Order MUST match training
        features = np.array([[
            data["avgPercentage"],
            data["attendance"],
            data["testCount"],
            data["trend"],
            data["weakTopics"],
            data["income"],
            data["feePaid"]
        ]])

        prediction = model.predict(features)[0]

        # Convert back to label
        labels = ["At Risk", "Safe", "Warning"]
        result = labels[prediction]

        return jsonify({
            "prediction": result
        })

    except Exception as e:
        return jsonify({"error": str(e)})

# Run server
if __name__ == "__main__":
    app.run(port=5001)