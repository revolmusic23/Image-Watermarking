new Vue({
    el: '#app',
    data: {
        imageFiles: [],
        watermarkFile: null,
        watermarkPositionX: 'center',
        watermarkPositionY: 'center',
        watermarkOpacity: 50,
        watermarkScale: 50,
        downloadLink: null,
        processedImage: null,
        processedImages: [],
        previewVisible: false,
        currentImageIndex: 0,
    },
    methods: {
        onImageFilesChange(event) {
            this.imageFiles = Array.from(event.target.files);
        },
        onWatermarkFileChange(event) {
            this.watermarkFile = event.target.files[0];
        },

        applyWatermark() {            
            if (!this.watermarkFile || this.imageFiles.length === 0) {
                alert('Please select images and watermark image first.');
                return;
            }

            let imageProcessingPromises = this.imageFiles.map(file => this.processImage(file));
            Promise.all(imageProcessingPromises).then(processedImages => {
                this.processedImages = processedImages;
            });
        },

        processImage(file) {
          return new Promise((resolve, reject) => {
              let reader = new FileReader();
              reader.onload = e => {
                  let img = new Image();
                  img.onload = () => {
                      let watermarkedImage = this.createWatermarkedImage(img, this.watermarkFile);
                      watermarkedImage.then(imageData => {
                          resolve(imageData);
                      });
                  };
                  img.src = e.target.result;
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
        },

        createWatermarkedImage(image, watermarkFile) {
            let canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            let watermark = new Image();
            return new Promise((resolve, reject) => {
                watermark.onload = () => {
                    let watermarkWidth = watermark.width * (this.watermarkScale / 100);
                    let watermarkHeight = watermark.height * (this.watermarkScale / 100);
                    let posX = (canvas.width - watermarkWidth) * this.getPositionRatio(this.watermarkPositionX);
                    let posY = (canvas.height - watermarkHeight) * this.getPositionRatio(this.watermarkPositionY);
                    ctx.globalAlpha = this.watermarkOpacity / 100;
                    ctx.drawImage(watermark, posX, posY, watermarkWidth, watermarkHeight);
        
                    resolve(canvas.toDataURL('image/png'));
                };
                watermark.onerror = reject;
                watermark.src = URL.createObjectURL(watermarkFile);
            });
        },

        showPreview() {
            if (this.processedImages.length > 0) {
                this.processedImage = this.processedImages[this.currentImageIndex];
                this.previewVisible = true;
            }
        },

        hidePreview() {
            this.previewVisible = false;
        },

        showNextImage() {
            if (this.currentImageIndex < this.processedImages.length - 1) {
                this.$set(this, 'currentImageIndex', this.currentImageIndex + 1);
            }
        },
        
        showPreviousImage() {
            if (this.currentImageIndex > 0) {
                this.$set(this, 'currentImageIndex', this.currentImageIndex - 1);
            }
        },

        getPositionRatio(position) {
            switch (position) {
                case 'left': case 'top': return 0;
                case 'center': return 0.5;
                case 'right': case 'bottom': return 1;
            }
        },

        downloadImagesAsZip() {
            let zip = new JSZip();
            this.processedImages.forEach((imageData, index) => {
                const base64Data = imageData.split(',')[1];
                zip.file(`image${index + 1}.png`, base64Data, {base64: true});
            });
    
            zip.generateAsync({type: "blob"}).then(content => {
                saveAs(content, "watermarked_images.zip");
            });
        }
    },
    watch: {
        currentImageIndex(newIndex) {
          if (newIndex >= 0 && newIndex < this.processedImages.length) {
              this.processedImage = this.processedImages[newIndex];
          }
        },
    },
});
