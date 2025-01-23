import cv2
import numpy as np
from ultralytics import YOLO
import cvzone

model = "modelos/modeloppt.pt"
classNames = ['papel', 'pedra', 'tesoura']


class InferenceClass:
    def __init__(self, model_path, class_names):
        self.model = YOLO(model_path)  # Carrega o modelo YOLO
        self.class_names = class_names  # Define os nomes das classes
        #self.tracker = cvzone.Tracker()  # Inicializa o rastreador de objetos
        self.count = 0  # Contador para "papel"
        self.countp = 0  # Contador para "pedra"
        self.countt = 0  # Contador para "tesoura"
        self.contador = []  # Lista para armazenar os IDs rastreados
        #self.linha = [100, 200, 500, 200]  # Exemplo de linha, ajustar conforme necessidade

    def run_inference(self, img):
        img = cv2.flip(img, 1)
        results = self.model(img, stream=True)
        detections = np.empty((0, 5))

        for obj in results:
            dados = obj.boxes
            for x in dados:
                #bounding boxes
                x1,y1,x2,y2 = x.xyxy[0]
                x1, y1, x2, y2 = int(x1),int(y1),int(x2),int(y2)
                w,h = x2-x1, y2-y1
                # cv2.rectangle(img,(x1,y1),(x1+w,y1+h),(255,0,0),3)
                #conf
                conf = int(x.conf[0]*100)
                #classe
                cls = int(x.cls[0])
                nomeClass = classNames[cls]
                if conf >=20 and nomeClass == "papel" or nomeClass=="pedra" or nomeClass== "tesoura":
                    cvzone.cornerRect(img,(x1,y1,w,h),colorR=(255,0,255))
                    cvzone.putTextRect(img,nomeClass,(x1,y1-10),scale=1.5,thickness=2)
                    crArray = np.array([x1,y1,x2,y2,conf])
                    detections = np.vstack((detections,crArray))

            '''# Verificação para linha horizontal
            if self.linha[0] < cx < self.linha[2] and self.linha[1] - 15 < cy < self.linha[1] + 15:
                if obj_id not in self.contador:
                    self.contador.append(obj_id)
                    cv2.line(img, (self.linha[0], self.linha[1]), (self.linha[2], self.linha[3]), (0, 255, 0), 5)

                    if self.class_names[cls] == 'papel':
                        self.count += 1
                    elif self.class_names[cls] == 'pedra':
                        self.countp += 1
                    elif self.class_names[cls] == 'tesoura':
                        self.countt += 1'''

        return img  # Retorna a imagem processada
    

# teste da classe OK 

'''# Inicializa o sistema de inferência
inference_system = InferenceClass(model, classNames)

# Abre uma imagem (ou captura de vídeo) para testar
img = cv2.imread("papel.jpeg")

# Realiza a inferência
result_img = inference_system.run_inference(img)

# Exibe a imagem processada
cv2.imshow("Resultado", result_img)
cv2.waitKey(0)
#cv2.destroyAllWindows()'''