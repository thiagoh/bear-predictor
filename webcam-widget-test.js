(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const cameraContainer = document.getElementById('camera');
    const webcamWidget = window.WebcamWidget.createWebcam({ parent: cameraContainer });
    console.log(webcamWidget);
  });
})();
