(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const cameraContainer = document.getElementById('camera');
    const webcamWidget = window.WebcamWidget.createWebcam({ width:440, parent: cameraContainer });
    console.log(webcamWidget);
  });
})();
