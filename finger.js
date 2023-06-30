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
    const btn = document.getElementById('button-submit');
    const inputImageUrl = document.getElementById('image-url');
    const inputImageFile = document.getElementById('image-file');
    const imgOutput = document.getElementById('img-output');
    const bearTypeOutput = document.getElementById('div-bear-type');
    let fileData;
    inputImageFile.addEventListener('change', () => {
      console.log('files:', inputImageFile.files[0]);
      getDataUrl(inputImageFile.files[0]).then((data) => {
        console.log('File data: ', data);
        fileData = data;
      });
    });
    btn.addEventListener('click', () => submit(fileData));

    const submit = (dataAsUrl) => {
      const http = new XMLHttpRequest();
      http.open('POST', 'https://thiagoh-test.hf.space/predict-finger');
      http.setRequestHeader('Content-type', 'application/json');
      http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState === XMLHttpRequest.DONE && http.status == 200) {
          console.log(http);
          const data = JSON.parse(http.responseText);
          // imgOutput.src = 'data:image/png;base64,' + data.imageEncodedBytes;
          imgOutput.src = dataAsUrl;
          bearTypeOutput.innerHTML = `Type is ${data.prediction} with confidence ${data.probability}`;
        }
      };
      const len = 'base64,'.length;
      const bytes = dataAsUrl.substring(dataAsUrl.indexOf('base64,') + len)
      http.send(JSON.stringify({ imageEncodedBytes: bytes }));
    };
  });
})();
