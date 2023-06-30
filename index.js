(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('button-submit');
    const inputImageUrl = document.getElementById('image-url');
    const imgOutput = document.getElementById('img-output');
    const bearTypeOutput = document.getElementById('div-bear-type');

    btn.addEventListener('click', () => submit(inputImageUrl.value));

    function submit(value) {
      const http = new XMLHttpRequest();
      http.open('POST', 'https://thiagoh-test.hf.space/predict-bear');
      http.setRequestHeader('Content-type', 'application/json');
      http.onreadystatechange = function () {
        //Call a function when the state changes.
        if (http.readyState === XMLHttpRequest.DONE && http.status == 200) {
          console.log(http);
          const data = JSON.parse(http.responseText);
          // imgOutput.src = 'data:image/png;base64,' + data.imageEncodedBytes;
          imgOutput.src = value;
          bearTypeOutput.innerHTML = `Type is ${data.prediction} with confidence ${data.probability}`;
        }
      };
      http.send(JSON.stringify({ imageUrl: value }));
    }
  });
})();