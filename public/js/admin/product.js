const unlistButtons = document.querySelectorAll('.unlist-btn');
const editButtons = document.querySelectorAll('.edit-btn');
let imagedata = '';




// Handle unlist button clicks
unlistButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
        const productId = this.getAttribute('data-id');
        const currentStatus = this.textContent.toLowerCase();
        const confirmationMessage = currentStatus === 'listed'
            ? 'Are you sure you want to unlist this product?'
            : 'Are you sure you want to list this product?';

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        //  product status
        fetch(`/admin/product/unlist/${productId}`, { method: 'PATCH' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Toggle the button text and class based on newStatus
                    if (data.newStatus === false) {
                        this.textContent = 'Listed';
                        this.classList.remove('btn-danger');
                        this.classList.add('btn-success');
                    } else {
                        this.textContent = 'Unlist';
                        this.classList.remove('btn-success');
                        this.classList.add('btn-danger');
                    }
                } else {
                    console.error('Failed to update product status');
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    });
});

// Add product
document.addEventListener('DOMContentLoaded', function () {

    const materials = [];

    //add metirial section
    const materialInput = document.getElementById('newProductMaterial');
    const addMaterialBtn = document.getElementById('addMaterialBtn');
    const materialList = document.getElementById('materialList');
    const materialsHiddenInput = document.getElementById('newProductMaterials');

    function addMaterial() {
        const material = materialInput.value.trim();
        if (material && !materials.includes(material)) {
            materials.push(material);
            updateMaterialList();
            materialInput.value = '';
        }
    }

    function removeMaterial(material) {
        const index = materials.indexOf(material);
        if (index > -1) {
            materials.splice(index, 1);
            updateMaterialList();
        }
    }

    function updateMaterialList() {
        materialList.innerHTML = '';
        materials.forEach(material => {
            const materialElement = document.createElement('div');
            materialElement.className = 'btn btn-primary mr-2 mb-2';
            materialElement.innerHTML = `${material} <span class="remove-material" data-material="${material}">&times;</span>`;
            materialList.appendChild(materialElement);
        });
        materialsHiddenInput.value = JSON.stringify(materials);
    }

    addMaterialBtn.addEventListener('click', addMaterial);

    materialInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMaterial();
        }
    });

    materialList.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-material')) {
            const material = e.target.getAttribute('data-material');
            removeMaterial(material);
        }
    });


    let cropper;
    let currentImageIndex = 0;
    let imagesToCrop = [];
    const croppedImages = []; // Array to store cropped images
    const cropControls = document.getElementById('addcropControls');
    const cropperImage = document.getElementById('addcropperImage');
    const nextButton = document.getElementById('nextButton');
    const productImageInput = document.getElementById('addproductImageInput');
    const addbtn = document.getElementById('addproductbtn')
    productImageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        console.log(files.length);
        if (files.length > 3) {
            return alert('cannot add morethan 3 images')
        }
        imagesToCrop = Array.from(files);
        currentImageIndex = 0;

        if (imagesToCrop.length > 0) {
            // Show cropping controls
            cropControls.style.display = 'block';
            loadImageToCrop(imagesToCrop[currentImageIndex]);
        }
    });

    function loadImageToCrop(file) {
        const reader = new FileReader();

        reader.onload = (event) => {
            cropperImage.src = event.target.result;
            cropperImage.style.display = 'block';


            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
            });
        };
        reader.readAsDataURL(file);
    }



    nextButton.addEventListener('click', () => {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob((blob) => {
                croppedImages.push(blob);
                currentImageIndex++;

                if (currentImageIndex < imagesToCrop.length) {
                    loadImageToCrop(imagesToCrop[currentImageIndex]);
                } else {

                    nextButton.style.display = 'none';
                    addbtn.style.display = 'block';
                }
            });
        }
    });

    const addform = document.getElementById('addProductForm');

    addform.action = "/admin/product/add";

    addbtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Perform validation
        let isValid = validateForm();
        if (!isValid) return;

        const formdata = new FormData(addform);
        console.log(croppedImages);
        formdata.metirial = materials
        croppedImages.forEach((image, index) => {
            formdata.append('addimage', image, `croppedImage${index}.jpg`);
        });

        fetch(addform.action, {
            method: 'POST',
            body: formdata,
        })
            .then(res => res.json())
            .then((res) => {
                console.log(res);
                if (res.success === true) {

                    window.location.reload(true)
                }
            })
            .catch(err => console.log(err));
    });

    // Validation
    function validateForm() {
        let isValid = true;
        const productName = document.getElementById('newProductName');
        const productCategory = document.getElementById('newProductCategory');
        const productDescription = document.getElementById('newProductDescription');
        const productPrice = document.getElementById('newProductPrice');
        const productStock = document.getElementById('newProductStock');
        const images = productImageInput.files;

        clearErrors();


        if (productName.value.trim() === "") {
            displayError(productName, 'Product name is required');
            isValid = false;
        }


        if (productCategory.value === "") {
            displayError(productCategory, 'Please select a category');
            isValid = false;
        }


        if (productDescription.value.trim() === "") {
            displayError(productDescription, 'Description is required');
            isValid = false;
        }


        if (productPrice.value.trim() === "" || parseFloat(productPrice.value) <= 0) {
            displayError(productPrice, 'Please enter a valid price');
            isValid = false;
        }


        if (productStock.value.trim() === "" || parseInt(productStock.value) < 0) {
            displayError(productStock, 'Please enter a valid stock');
            isValid = false;
        }

        if (images.length === 0) {
            displayError(imageInput, 'Please upload at least one image');
            isValid = false;
        }

        return isValid;
    }

    function displayError(inputElement, message) {
        const errorElement = document.createElement('small');
        errorElement.className = 'text-danger';
        errorElement.innerText = message;
        inputElement.parentNode.appendChild(errorElement);
    }

    //  clear previous errors
    function clearErrors() {
        const errors = document.querySelectorAll('.text-danger');
        errors.forEach(error => error.remove());
    }

});

//------------------------------------------------

// edit Selection
document.addEventListener('DOMContentLoaded', function () {
    let editMaterials
    const editButtons = document.querySelectorAll('.edit-btn');
    const imageContainer = document.getElementById('currentImages');
    let deletedImages = []; // Array to store images marked for deletion
    let productId;

    // loop through each edit button    
    editButtons.forEach(button => {
        button.addEventListener('click', handleEditButtonClick);
    });

    //  image deletion  
    imageContainer.addEventListener('click', handleImageDeletion);

    //  form submission to update the product
    const form = document.getElementById('editProductForm');
    form.addEventListener('submit', handleFormSubmission);

    function handleEditButtonClick() {  

        const productImages = JSON.parse(this.getAttribute('data-images'));
        productId = this.getAttribute('data-id');
        const productName = this.getAttribute('data-name');
        const productCategoryId = this.getAttribute('data-category'); // Get category ID
        const productDescription = this.getAttribute('data-description');
        const stock = this.dataset.stock;
        const price = this.dataset.price;
        const offer = this.dataset.offer;

        
        // editMaterialInput

const editMaterialInput = document.getElementById('editProductMaterial');
  const editAddMaterialBtn = document.getElementById('editAddMaterialBtn');
  const editMaterialList = document.getElementById('editMaterialList');
  const editMaterialsHiddenInput = document.getElementById('editProductMaterials');
  console.log(this.dataset.material);
  let sevedmaterial
  
  if(this.dataset.material){
    sevedmaterial=JSON.parse(this.dataset.material)
  }
   editMaterials = sevedmaterial||[]; 
  console.log(editMaterials);
  if(editMaterials.length>0){
    updateEditMaterialList()
  }
  


  function addEditMaterial() {
    const material = editMaterialInput.value.trim();
    if (material && !editMaterials.includes(material)) {
      editMaterials.push(material);
      updateEditMaterialList();
      editMaterialInput.value = '';
      console.log(editMaterials);
      
    }
  }

  function removeEditMaterial(material) {
    const index = editMaterials.indexOf(material);
    if (index > -1) {
      editMaterials.splice(index, 1);
      updateEditMaterialList();
    }
  }

  function updateEditMaterialList() {
    editMaterialList.innerHTML = '';
    editMaterials.forEach(material => {
      const materialElement = document.createElement('div');
      materialElement.className = 'btn btn-primary mr-2 mb-2';
      materialElement.innerHTML = `${material} <span class="remove-edit-material" data-material="${material}">&times;</span>`;
      editMaterialList.appendChild(materialElement);
    });
    // editMaterialsHiddenInput.value = JSON.stringify(editMaterials);
  }

  editAddMaterialBtn.addEventListener('click', addEditMaterial);

  editMaterialInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEditMaterial();
    }
  });

  editMaterialList.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-edit-material')) {
      const material = e.target.getAttribute('data-material');
      removeEditMaterial(material);
    }
  });


        // Clear previous images from the modal
        imageContainer.innerHTML = '';

        // Populate the modal with product images
        productImages.forEach(image => {
            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('position-relative', 'm-2');
            imageWrapper.innerHTML = `
                <img src="/uploads/${image}" class="product-image img-thumbnail" style="width: 100px; height: 100px;" alt="Product Image">
                <button type="button" class="btn btn-danger btn-sm delete-image-btn position-absolute" style="top: 5px; right: 5px;" data-image="${image}" aria-label="Delete image">&times;</button>
            `;
            imageContainer.appendChild(imageWrapper);
        });

        // Clear the deletedImages array when modal opens
        deletedImages = [];

        // Set the form fields with product info
        document.getElementById('productName').value = productName;
        document.getElementById('productDescription').value = productDescription;
        document.getElementById('productStock').value = stock;
        document.getElementById('productprice').value = price;
        document.getElementById('productOffer').value = offer;

        //  correct category in the dropdown
        const categorySelect = document.getElementById('productCategory');
        categorySelect.value = productCategoryId;

        // form action to the correct product ID
        form.action = `/admin/product/images/edit/${productId}`;

        // Show the modal
        $('#editProductModal').modal('show');
    }

    function handleImageDeletion(event) {
        if (event.target.classList.contains('delete-image-btn')) {
            const imageToDelete = event.target.getAttribute('data-image');
            const confirmDelete = confirm('Do you want to delete the image?');
            if (confirmDelete) {
                deletedImages.push(imageToDelete); // Add image to the list of deleted images
                event.target.closest('.position-relative').remove(); // Remove image from the modal
            }
        }
    }

    function handleFormSubmission(event) {
        event.preventDefault(); // Prevent default form submission

        // Create FormData object and append all form data
        const formData = new FormData(this);
        formData.append('deletedImages', JSON.stringify(deletedImages)); // Send the deleted images array

        const url = form.action; // Get the form action URL

        // Submit the form data via fetch
        fetch(url, {
            method: 'PATCH',
            body: formData, // Do not convert to JSON; keep it as FormData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload(true)
                } else {
                    alert('Failed to update product: ' + data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred while processing your request. Please try again.");
            });
    }



    // Select DOM elements
    const productImageInput = document.getElementById('productImageInput');
    const cropperImage = document.getElementById('cropperImage');
    const cropControls = document.getElementById('cropControls');
    const croppedImagesPreview = document.getElementById('croppedImagesPreview');
    const saveCroppedImageBtn = document.getElementById('saveCroppedImage');
    const cropNextImageBtn = document.getElementById('cropNextImage');
    const editProductForm = document.getElementById('editProductForm');

    let cropper;
    let currentImageIndex = 0;
    let imagesToCrop = [];

    // Handle image file selection
    productImageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        imagesToCrop = Array.from(files);
        currentImageIndex = 0; // Reset index to start from the first image

        if (imagesToCrop.length > 0) {
            // Show cropping controls
            cropControls.style.display = 'block';
            loadImageToCrop(imagesToCrop[currentImageIndex]);
        }


    });

    // Load image into the cropper
    function loadImageToCrop(file) {
        const reader = new FileReader();

        reader.onload = (event) => {
            cropperImage.src = event.target.result;
            cropperImage.style.display = 'block';

            // Initialize Cropper.js
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(cropperImage, {
                aspectRatio: 0.7 / 0.5,
                viewMode: 1,
                background: false
            });
        };
        reader.readAsDataURL(file);
    }

    // Crop and save the image
    saveCroppedImageBtn.addEventListener('click', function () {
        const canvas = cropper.getCroppedCanvas();


        canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append('croppedImage', blob, 'croppedImage.jpg');

            // Show the cropped image preview
            const imgPreview = document.createElement('img');
            imgPreview.src = URL.createObjectURL(blob);
            imgPreview.classList.add('img-thumbnail', 'm-2');
            imgPreview.style.width = '90px';
            imgPreview.style.height = '90px';
            croppedImagesPreview.appendChild(imgPreview);

            // Submit the cropped image
            Swal.fire({
                title: 'Processing...',
                text: 'Please wait.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false, // No "OK" button
                didOpen: () => {
                  Swal.showLoading(); // Show loading spinner
                }
              });
            fetch(`/admin/product/images/edit/${productId}`, {
                method: 'PATCH',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.close();
                        Swal.fire({
                            title: 'Success!',
                            text: 'Your image upload success.',
                            icon: 'success',
                            allowOutsideClick: false,
                            
                            confirmButtonText: 'OK'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              window.location.reload(true)
                            } })
                          
                        // processNextImageForCropping();

                    } else {
                        alert('Upload failed: ' + data.message);
                    }
                })
                .catch(error => {
                    console.log('An error occurred: ' + error);
                });

            // Process the next image for cropping
        }, 'image/jpeg');
    });

    // Process the next image
    function processNextImageForCropping() {
        currentImageIndex++;
        if (currentImageIndex < imagesToCrop.length) {
            loadImageToCrop(imagesToCrop[currentImageIndex]);
        } else {
            // No more images to crop
            cropControls.style.display = 'none';
            cropperImage.style.display = 'none';
            imagesToCrop = [];
            window.location.reload(true)
            // Clear imagesToCrop array
        }
    }




    // Prevent default form submission
    editProductForm.addEventListener('submit', function (event) {
        event.preventDefault();
        // Handle other form data submission if needed, for example:
        const eformData = new FormData(editProductForm);
        material=JSON.stringify(editMaterials)
        eformData.append('material', material);
        
        

        fetch(`/admin/product/edit/${productId}`, {
            method: 'PATCH',
            body: eformData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Product updated successfully');
                    // Optionally close the modal or reset the form
                } else {
                    alert('Update failed: ' + data.message);
                }
            })
            .catch(error => {
                console.log('An error occurred: ' + error);
            });
    });

});

