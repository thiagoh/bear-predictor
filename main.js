(() => {
  function startup() {
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.

    const width = 320; // We will scale the photo width to this
    let height = 0; // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    let streaming = false;

    function showViewLiveResultButton() {
      if (window.self !== window.top) {
        // Ensure that if our document is in a frame, we get the user
        // to first open it in its own tab or window. Otherwise, it
        // won't be able to request permission for camera access.
        document.querySelector('.contentarea').remove();
        const button = document.createElement('button');
        button.textContent = 'View live result of the example code above';
        document.body.append(button);
        button.addEventListener('click', () => window.open(location.href));
        return true;
      }
      return false;
    }

    function toGrayScale(canvas, image) {
      // const canvas = document.createElement('canvas');
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

    function initCam() {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then(stream => {
          video.srcObject = stream;
          video.play();
        })
        .catch(err => {
          console.error(`An error occurred: ${err}`);
        });

      video.addEventListener(
        'canplay',
        ev => {
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
            streaming = true;
          }
        },
        false
      );
      // takePhotoButton.addEventListener('click', takePicture);
      takePhotoButton.addEventListener('click', takeNewPhoto);
      clearPhoto();
    }

    // Fill the photo with an indication that none has been
    // captured.

    function clearPhoto() {
      const context = canvas.getContext('2d');
      context.fillStyle = '#AAA';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // const data = canvas.toDataURL('image/png');
      // photo.setAttribute('src', data);
    }

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.
    function takeNewPhoto() {
      const currentPrefix = prefix.value.trim();
      const currentLabel = imageLabel.value.trim();
      if (!currentLabel) {
        throw new Error('Label is not defined');
      }

      const context = canvas.getContext('2d');
      if (!width || !height) {
        clearPhoto();
        throw new Error('Width or height are now defined');
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      // const data = canvas.toDataURL('image/png');
      const data = grayScaleCheck.checked ? toGrayScale(canvas) : canvas.toDataURL('image/png');

      const photo = document.createElement('img');
      photo.className = 'photo-card';
      photo.setAttribute('src', data);

      const cell = document.createElement('div');
      cell.className = 'col-4 align-self-start';

      const anchor = document.createElement('a');
      anchor.href = data;
      anchor.download = `${currentPrefix}${Utils.uuid()}_${currentLabel}`;
      anchor.appendChild(photo);
      cell.appendChild(anchor);
      photoOutput.appendChild(cell);
    }

    function startSession() {}
    function clearSession() {
      photoOutput.innerHTML = '';
    }

    if (showViewLiveResultButton()) {
      return;
    }

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startSessionButton = document.getElementById('button-submit');
    const clearSessionButton = document.getElementById('button-clear');
    const takePhotoButton = document.getElementById('startbutton');
    const grayScaleCheck = document.getElementById('grayscale-check');
    const photoOutput = document.getElementById('photo-output');
    const photo = document.getElementById('photo');
    const photoBytes = document.getElementById('photo_bytes');
    const imageLabel = document.getElementById('image-label');
    const currentCaptureInterval = document.getElementById('current-capture-interval');
    const captureInterval = document.getElementById('capture-interval');
    const updateCurrentCaptureInterval = () => (currentCaptureInterval.innerHTML = `${captureInterval.value}(s)`);
    updateCurrentCaptureInterval();

    captureInterval.addEventListener('change', updateCurrentCaptureInterval);
    startSessionButton.addEventListener('click', startSession);
    clearSessionButton.addEventListener('click', clearSession);

    initCam();
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('DOMContentLoaded', startup);
})();
