(function () {
    emailjs.init("rZUu9htn801_jj4cD");
})();

document
    .getElementById("contact-form")
    ?.addEventListener("submit", function (event) {
        event.preventDefault();

        const serviceID = "service_f05d8gn";
        const templateAdmin = "template_2olmcqb";
        const templateUser = "template_b4leipl";

        emailjs.sendForm(serviceID, templateAdmin, this)
            .then(() => {
                return emailjs.sendForm(serviceID, templateUser, this);
            })
            .then(() => {
                alert("Mensaje enviado correctamente. Revisa tu correo.");
                this.reset();
            })
            .catch((error) => {
                alert("Ocurrió un error al enviar el mensaje.");
                console.error(error);
            });
    });

const textos = document.querySelectorAll('.header-texto');
let indice = 0;

if (textos.length > 0) {
    setInterval(() => {
        textos[indice].classList.remove('activo');
        indice = (indice + 1) % textos.length;
        textos[indice].classList.add('activo');
    }, 6000);
}
