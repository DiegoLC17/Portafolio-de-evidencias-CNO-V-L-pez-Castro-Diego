(function () {
    emailjs.init("rZUu9htn801_jj4cD");
})();

const form = document.getElementById("contact-form");

if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();
    
        const nombre = form.name.value.trim();
        const email = form.email.value.trim();
        const mensaje = form.message.value.trim();
    
        if (!nombre || !email || !mensaje) {
            alert("Por favor, completa todos los campos correctamente.");
            return;
        }
    
        emailjs.sendForm(serviceID, templateAdmin, this)
            .then(() => emailjs.sendForm(serviceID, templateUser, this))
            .then(() => {
                alert("Mensaje enviado correctamente. Revisa tu correo.");
                this.reset();
            })
            .catch((error) => {
                alert("Ocurrió un error al enviar el mensaje.");
                console.error(error);
            });
    });
}

const textos = document.querySelectorAll('.header-texto');
let indice = 0;

if (textos.length > 0) {
    setInterval(() => {
        textos[indice].classList.remove('activo');
        indice = (indice + 1) % textos.length;
        textos[indice].classList.add('activo');
    }, 6000);
}

