document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando acesso à câmera...');

    const mainBox = document.querySelector('.main-box'); 

    if (!mainBox) {
        console.error('Elemento .main-box não encontrado');
        return;
    }

    const videoElement = document.createElement('video');
    videoElement.style.width = '100%';
    videoElement.style.height = 'auto';
    videoElement.style.transform = 'scaleX(-1)';
    mainBox.appendChild(videoElement);

    const imgElement = document.createElement('img');
    imgElement.style.width = '100%';
    imgElement.style.height = 'auto';
    imgElement.style.display = 'none';
    mainBox.appendChild(imgElement);

    let cameraStream;

    function startCameraStream() {
        return navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                cameraStream = stream;
                videoElement.srcObject = stream;
                videoElement.play();
                console.log('Câmera iniciada com sucesso.');

                // Aguarda o vídeo estar pronto para capturar o frame inicial
                videoElement.onloadedmetadata = function() {
                    captureAndSendFrame();
                };
            })
            .catch(function(error) {
                console.error('Erro ao acessar a câmera: ', error);
            });
    }

    function captureAndSendFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');

            fetch('http://localhost:5000/process_image', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na requisição: ' + response.status);
                }
                console.log('Imagem inicial enviada para carregar o modelo.');
                stopCameraStream();  // Para a câmera após o envio
            })
            .catch(error => {
                console.error('Erro ao processar a resposta:', error);
            });
        }, 'image/jpeg');
    }

    function stopCameraStream() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            console.log('Stream da câmera encerrado.');
        }
    }

    // Inicia o stream da câmera ao carregar a página e captura o frame inicial
    startCameraStream();

    // Eventos dos botões para start/stop (caso necessário iniciar e parar o processamento manualmente)
    document.getElementById("start-btn").addEventListener("click", startProcessing);
    document.getElementById("stop-btn").addEventListener("click", stopProcessing);

    let isProcessing = false;
    let processingInterval;

    function startProcessing() {
        if (!isProcessing) {
            isProcessing = true;
            imgElement.style.display = 'none';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            processingInterval = setInterval(function() {
                if (!isProcessing) {
                    clearInterval(processingInterval);
                    return;
                }

                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(function(blob) {
                    const formData = new FormData();
                    formData.append('image', blob, 'frame.jpg');

                    fetch('http://localhost:5000/process_image', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro na requisição: ' + response.status);
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        const imageUrl = URL.createObjectURL(blob);
                        imgElement.src = imageUrl;

                        imgElement.onload = () => {
                            URL.revokeObjectURL(imageUrl);
                        };

                        videoElement.style.display = 'none';
                        imgElement.style.display = 'block';
                    })
                    .catch(error => {
                        console.error('Erro ao processar a resposta:', error);
                    });
                }, 'image/jpeg');
            }, 100);
        }
    }

    function stopProcessing() {
        if (isProcessing) {
            clearInterval(processingInterval);
            isProcessing = false;

            setTimeout(() => {
                console.log('10 segundos se passaram desde que o processamento foi parado.');
                imgElement.style.display = 'none';
                imgElement.src = '';

                videoElement.style.display = 'block';
                videoElement.srcObject = cameraStream;
                videoElement.play();
            }, 10000);

            console.log('Processamento interrompido e câmera retomada.');
        }
    }
});