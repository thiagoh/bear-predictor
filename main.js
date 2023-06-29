(() => {
  function startup() {
    function hasGetUserMedia() {
      return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }
    if (hasGetUserMedia()) {
      // Good to go!
    } else {
      alert('getUserMedia() is not supported in your browser');
      throw Error('getUserMedia() is not supported in your browser');
    }
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
        .then((stream) => {
          video.srcObject = stream;
          video.play();
          // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
          // See crbug.com/110938.
          video.onloadedmetadata = function (e) {
            // Ready to go. Do some stuff.
          };
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
            streaming = true;
          }
        },
        false,
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

    function downloadAllPhotos() {
      Array.prototype.slice.call(document.querySelectorAll('a.anchor-photo-card'), 0).forEach((a, i) => {
        setTimeout(() => a.click(), i++ * 200);
      });
    }

    let numberOfPhotos = 0;
    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.
    function takeNewPhoto() {
      const currentPrefix = prefix.value.trim();
      const currentLabel = imageLabel.value.trim();
      if (!currentLabel) {
        imageLabel.classList.add('is-invalid');
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
      cell.className = 'col-xl-4 col-md-6 align-self-start';

      const anchor = document.createElement('a');
      anchor.className = 'anchor-photo-card d-inline-block position-relative';
      anchor.href = data;
      anchor.download = `${currentPrefix}${Utils.uuid()}_${currentLabel}`;
      anchor.appendChild(photo);
      const photoDeleteIcon = document.createElement('div');
      photoDeleteIcon.innerHTML = 'X';
      photoDeleteIcon.className = 'photo-delete position-absolute top-0 end-0 m-2';
      anchor.addEventListener('mousemove', (event) => {
        if (event.shiftKey) {
          anchor.appendChild(photoDeleteIcon);
        } else {
          if (anchor.contains(photoDeleteIcon)) {
            anchor.removeChild(photoDeleteIcon);
          }
        }
      });
      anchor.addEventListener('mouseover', (event) => {
        if (event.shiftKey) {
          anchor.appendChild(photoDeleteIcon);
        } else {
          if (anchor.contains(photoDeleteIcon)) {
            anchor.removeChild(photoDeleteIcon);
          }
        }
      });
      anchor.addEventListener('mouseout', (event) => {
        if (anchor.contains(photoDeleteIcon)) {
          anchor.removeChild(photoDeleteIcon);
        }
      });
      anchor.addEventListener('click', (event) => {
        if (event.shiftKey) {
          cell.remove();
          event.preventDefault();
        }
      });
      cell.appendChild(anchor);
      photoOutput.prepend(cell);

      numberOfPhotos = (numberOfPhotos || 0) + 1;
      numberOfPhotosSpan.innerHTML = numberOfPhotos;
    }

    let photoSessionIntervalHandler;
    function startStopSession() {
      if (startStopSession.sessionIsRunning) {
        stopSession();
      } else {
        startSession();
      }
    }
    function startSession() {
      const currentCaptureInterval = Math.max(1, parseInt(currentCaptureIntervalRange.value) || 1);
      photoSessionIntervalHandler && clearInterval(photoSessionIntervalHandler);
      photoSessionIntervalHandler = setInterval(() => {
        try {
          takeNewPhoto();
        } catch (e) {
          stopSession();
          console.error(e);
        }
      }, currentCaptureInterval * 1000);
      startSessionButton.value = 'Stop Session';
      startStopSession.sessionIsRunning = true;
    }

    function stopSession() {
      photoSessionIntervalHandler && clearInterval(photoSessionIntervalHandler);
      startSessionButton.value = 'Start Session';
      startStopSession.sessionIsRunning = false;
    }
    function clearSession() {
      stopSession();
      numberOfPhotos = 0;
      imageLabel.value = '';
      photoOutput.innerHTML = '';
      numberOfPhotosSpan.innerHTML = `${numberOfPhotos}`;
      clearImageLabelValidation();
    }

    if (showViewLiveResultButton()) {
      return;
    }

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startSessionButton = document.getElementById('button-start-session');
    const clearSessionButton = document.getElementById('button-clear');
    const downloadAllButton = document.getElementById('button-download-all');
    const takePhotoButton = document.getElementById('startbutton');
    const grayScaleCheck = document.getElementById('grayscale-check');
    const spacebarForPhotoCheck = document.getElementById('spacebar-for-photo-check');
    const photoOutput = document.getElementById('photo-output');
    const imageLabel = document.getElementById('image-label');
    const currentCaptureIntervalRange = document.getElementById('current-capture-interval');
    const numberOfPhotosSpan = document.getElementById('number-of-photos');
    const captureInterval = document.getElementById('capture-interval');
    const updateCurrentCaptureInterval = () => (currentCaptureIntervalRange.innerHTML = `${captureInterval.value}(s)`);
    updateCurrentCaptureInterval();

    const clearImageLabelValidation = () => imageLabel.classList.remove('is-invalid');
    imageLabel.addEventListener('change', clearImageLabelValidation);
    imageLabel.addEventListener('keyup', clearImageLabelValidation);
    captureInterval.addEventListener('change', updateCurrentCaptureInterval);
    startSessionButton.addEventListener('click', startStopSession);
    clearSessionButton.addEventListener('click', clearSession);
    downloadAllButton.addEventListener('click', downloadAllPhotos);

    document.body.addEventListener('keypress', (event) => {
      if (document.activeElement === document.body && spacebarForPhotoCheck.checked === true && event.code === 'Space') {
        takeNewPhoto();
        event.preventDefault();
      }
    });

    initCam();
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('DOMContentLoaded', startup);
})();
