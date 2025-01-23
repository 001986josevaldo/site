from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
from io import BytesIO
import numpy as np
from inference import InferenceClass  # Classe que contém run_inference
import subprocess
import os

# ----------------------------------------------------------------

# USAR O COMANDO PARA ATIVAR O SERVIDOR FLASK
# flask --app indicar o caminho para o arquivo beckend.py
# flask --app beckend/beckend.py run

app = Flask(__name__)
CORS(app) # Habilita CORS para todas as rotas

model = "beckend/modelos/modeloppt.pt"
classNames = ['papel', 'pedra', 'tesoura']
inference_system = InferenceClass(model, classNames)

@app.route('/process_image', methods=['POST'])

def process_image():
    file = request.files['image'].read()  # Recebe a imagem do frontend
    npimg = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)  # Decodifica a imagem

    processed_img = inference_system.run_inference(img)  # Processa a imagem com o método run_inference

    # Codifica a imagem processada em formato JPEG
    _, img_encoded = cv2.imencode('.jpg', processed_img)
    img_bytes = BytesIO(img_encoded)# Cria um objeto BytesIO a partir da imagem codificada

    # Dados de detecção
    '''results = {
        "total": model.total_label.text(),
        "papel": model.papel_label.text(),
        "pedra": model.pedra_label.text(),
        "tesoura": model.tesoura_label.text()
    }
    '''
    # Retorna a imagem processada e os resultados
    return send_file(img_bytes, mimetype='image/jpeg')


if __name__ == '__main__':
    app.run(debug=True)