(() => {
  function createWebcam({ parent, width = 320, height, events: { photoTaken } = {} }) {
    function init() {
      let lastPhotoTaken;
      const widget = document.createElement('div');
      widget.innerHTML = `
      <video style="display:flex;margin-left:auto;margin-right:auto;" autoplay muted playsinline>Video stream not available.</video>
      <button style="display:flex;position:relative;margin-left:auto;margin-right:auto;bottom:32px;background-color:rgba(0, 150, 0, 0.7); border:1px solid rgba(255, 255, 255, 0.7); box-shadow: 0px 0px 1px 2px rgba(0, 0, 0, 0.2);font-size:14px;font-family:"Lucida Grande","Arial",sans-serif;color:rgba(255,255,255,1);">Take photo</button>
      <canvas style="display:none;"></canvas>`;
      const video = widget.getElementsByTagName('video')[0];
      const button = widget.getElementsByTagName('button')[0];
      const canvas = widget.getElementsByTagName('canvas')[0];

      parent.appendChild(widget);

      // Capture a photo by fetching the current contents of the video
      // and drawing it into a canvas, then converting that to a PNG
      // format data URL. By drawing it on an offscreen canvas and then
      // drawing that to the screen, we can change its size and/or apply
      // other changes before drawing it.
      function _takePhoto() {
        const context = canvas.getContext('2d');
        if (!width || !height) {
          _clearPhoto();
          throw new Error('Width or height are now defined');
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        lastPhotoTaken = canvas.toDataURL('image/png');
        photoTaken(lastPhotoTaken);
        return lastPhotoTaken;
      }

      function _toGrayScale(canvas) {
        let context = canvas.getContext('2d');
        let imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        let pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          //let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
          let lightness = parseInt(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
          pixels[i] = lightness;
          pixels[i + 1] = lightness;
          pixels[i + 2] = lightness;
        }
        context.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
      }
      function _clearPhoto({ canvas }) {
        const context = canvas.getContext('2d');
        context.fillStyle = '#AAA';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      const streaming = video.getAttribute('data-streaming') === 'true';
      // https://simpl.info/getusermedia/sources/
      // https://github.com/samdutton/simpl/blob/gh-pages/getusermedia/sources/js/main.js
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
        })
        .catch((err) => {
          console.error(`An error occurred: ${err}`);
        });

      video.addEventListener(
        'canplay',
        (event) => {
          if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width);

            // Firefox currently has a bug where the height can't be read from
            // the video, so we will make assumptions if this happens.

            if (isNaN(height)) {
              height = width / (4 / 3);
            }

            video.setAttribute('width', width);
            video.setAttribute('height', height);
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            video.setAttribute('data-streaming', 'true');
          }
        },
        false,
      );

      button.addEventListener('click', _takePhoto);

      _clearPhoto({ video, canvas });

      function WebcamWidget() {
        this.getLastPhoto = function getLastPhoto() {
          return lastPhotoTaken;
        };
        this.takePhoto = function takePhoto() {
          return _takePhoto();
        };
      }
      return new WebcamWidget();
    }
    function hasGetUserMedia() {
      return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }
    if (!hasGetUserMedia()) {
      throw Error('getUserMedia() is not supported in your browser');
    }

    return init();
  }

  function downloadAllPhotos() {
    Array.prototype.slice.call(document.querySelectorAll('a.anchor-photo-card'), 0).forEach((a, i) => {
      setTimeout(() => a.click(), i++ * 200);
    });
  }

  window.WebcamWidget = { createWebcam };
})();
