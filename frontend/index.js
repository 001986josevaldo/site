document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando acesso à câmera...');

    const mainBox = document.querySelector('.main-box'); 

    if (!mainBox) {
        console.error('Elemento .main-box não encontrado');
        return;
    }

    // Criação do elemento de vídeo para mostrar o feed da câmera
    const videoElement = document.createElement('video');
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover'; // Preenche o espaço cortando se necessário
    videoElement.style.transform = 'scaleX(-1)'; // Inverte o vídeo na horizontal
    mainBox.appendChild(videoElement); 

    // Criação do elemento de imagem para exibir os frames processados
    const imgElement = document.createElement('img');
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';
    imgElement.style.objectFit = 'cover'; // Preenche o espaço cortando se necessário
    imgElement.style.display = 'none'; // Oculto inicialmente
    mainBox.appendChild(imgElement); 

    // Variável para armazenar o stream da câmera
    let cameraStream;

    // Função para iniciar o stream da câmera
    function startCameraStream() {
        return navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                cameraStream = stream; // Armazena o stream da câmera
                videoElement.srcObject = stream;
                videoElement.play();
                console.log('Câmera iniciada com sucesso.');
            })
            .catch(function(error) {
                console.error('Erro ao acessar a câmera: ', error);
            });
    }

    // Inicia o stream ao carregar a página
    startCameraStream();
    
    // Controle do estado de processamento
    let isProcessing = false;
    let processingInterval;

    // Função que inicia o processamento
    function startProcessing() {
        if (!isProcessing) {
            isProcessing = true;  // Marca como processando
            imgElement.style.display = 'none';  // Oculta a imagem processada

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Intervalo de processamento
            processingInterval = setInterval(function() {
                if (!isProcessing) {
                    clearInterval(processingInterval);  // Limpa o intervalo se não estiver processando
                    return; // Sai da função se não deve processar
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
                        return response.blob();  // Retorna a imagem processada como blob
                    })
                    .then(blob => {
                        const imageUrl = URL.createObjectURL(blob);
                        imgElement.src = imageUrl;

                        // Libera a URL do objeto quando a imagem carregar
                        imgElement.onload = () => {
                            URL.revokeObjectURL(imageUrl);
                        };

                        // Alterna entre o vídeo e a imagem processada
                        videoElement.style.display = 'none'; // Esconde o vídeo
                        imgElement.style.display = 'block';  // Exibe a imagem processada
                    })
                    .catch(error => {
                        console.error('Erro ao processar a resposta:', error);
                    });
                }, 'image/jpeg');
            }, 100); // Ajuste o intervalo conforme necessário
        }
    }

    // Função que para o processamento
    function stopProcessing() {
        if (isProcessing) {
            clearInterval(processingInterval);  // Para o intervalo de processamento
            isProcessing = false;  // Marca como não processando
            // Pausa de 10 segundos
            setTimeout(() => {
                console.log('10 segundos se passaram desde que o processamento foi parado.');
                // Oculta a última imagem processada e limpa o src
                imgElement.style.display = 'none';  
                imgElement.src = '';  // Limpa o src da última imagem processada

                // Mostra o feed da câmera novamente
                videoElement.style.display = 'block';  
                videoElement.srcObject = cameraStream; // Garante que o vídeo volte a ser o stream da câmera
                videoElement.play(); // Reinicia o vídeo da câmera
            }, 1000); // 10000 milissegundos = 10 segundos
    
            console.log('Processamento interrompido e câmera retomada.');  
        }
    }
    startProcessing(); // ao iniciar a pagina preciso que a função seja chamada
    stopProcessing(); // e fechada
    // Eventos dos botões Start e Stop
    document.getElementById("start-btn").addEventListener("click", startProcessing);
    document.getElementById("stop-btn").addEventListener("click", stopProcessing);
});

// erro na função stop era pq ainda chegava imagens
// correção acrescentado 1s para execução 