(() => {
  const getDataUrl = (readFile) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.addEventListener('loadstart', () => console.log('load start'));
      reader.addEventListener('load', () => console.log('load'));
      reader.addEventListener('loadend', () => console.log('load end'));

      reader.addEventListener('load', () => {
        resolve(reader.result);
      });
      reader.addEventListener('progress', (event) => {
        console.log('progress', event);
      });
      reader.addEventListener('error', (event) => {
        console.error('error', event);
      });
      reader.readAsDataURL(readFile);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const cameraContainer = document.getElementById('camera');
    const webcamWidget = window.WebcamWidget.createWebcam({
      width: 440,
      parent: cameraContainer,
      events: {
        photoTaken: (data) => {
          console.log(data);
          submit(data);
        },
      },
    });

    // setInterval(() => {
    //   webcamWidget.takePhoto();
    // }, 2000);

    const btn = document.getElementById('button-submit');
    const inputImageUrl = document.getElementById('image-url');
    const inputImageFile = document.getElementById('image-file');
    const imgOutput = document.getElementById('img-output');
    const fingerTpeOutput = document.getElementById('div-finger-type');
    let fileData;
    inputImageFile.addEventListener('change', () => {
      console.log('files:', inputImageFile.files[0]);
      getDataUrl(inputImageFile.files[0])
        .then((data) => {
          console.log('File data: ', data);
          fileData = data;
          return data;
        })
        .then((data) => {
          submit(data);
        });
    });
    btn.addEventListener('click', () => submit(fileData));

    const submit = (dataAsUrl) => {
      imgOutput.src = dataAsUrl;
      const http = new XMLHttpRequest();
      http.open('POST', 'https://thiagoh-simple-predictor.hf.space/predict-finger');
      http.setRequestHeader('Content-type', 'application/json');
      http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState === XMLHttpRequest.OPENED || http.readyState === XMLHttpRequest.LOADING) {
          console.log('LOADING', http);
          fingerTpeOutput.innerHTML = 'Loading...';
        } else if (http.readyState === XMLHttpRequest.DONE && http.status == 200) {
          console.log('DONE', http);
          const predictionData = JSON.parse(http.responseText);
          fingerTpeOutput.innerHTML = `Type is ${predictionData.prediction} with confidence ${predictionData.probability}`;
        }
      };
      const len = 'base64,'.length;
      const bytes = dataAsUrl.substring(dataAsUrl.indexOf('base64,') + len);
      http.send(JSON.stringify({ imageEncodedBytes: bytes }));
    };
  });
})();
