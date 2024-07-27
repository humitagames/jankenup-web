// Obtencion de la data a usar por el deeplink
const params = window.location.pathname.replace("/deep/", "");
let finalURL = `jankenup://deep/`;
const playeerNameLength = 10;
const localStorageKey = "player-name";
let connecting = false;

// Obtener la room a la que se esta invitando
const room = ( _ => {

    const parameters = params.split("/");
    if(parameters.length > 1 && parameters[0].toLowerCase() == "room") return parameters[1];

    return "-";

})();

// Agregar al mensaje el nombre de la sala
document.querySelector(".text").dataset.localizationArguments = room;

// Configuracion de la accion del boton
const link = document.querySelector("a.join");
link.addEventListener("click", event => {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    if(connecting) return;
    connecting = true;
    
    // Comprobar que nombre este completo
    const playerName = nameInput.value.trim().substr(0,playeerNameLength);
    if(!playerName) return;

    // Guardar el nombre en el localStorage
    localStorage.setItem(localStorageKey, playerName);
    finalURL = `${finalURL}room/${room}/player/${playerName}`;
    
    Localization.GetTranslate("deeplinkRoom","checking", link);
    link.classList.add("connecting");

    const ios = ( _ => {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
          ].includes(navigator.platform)
          // iPad on iOS 13 detection
          || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    })();
    
    if(ios) window.location = finalURL;
    else{
        window.customProtocolCheck(
            finalURL,
            () => {
                window.location = "http://onelink.to/jankenup";
            },
            () => {}, 2000
        );
    }
});

// Ligar la inclusion del nombre con la activacion del boton. Ademas, guardar nombre final en local storage para futuras invitaciones
const nameInput = document.querySelector("input[name=name]");

nameInput.addEventListener("input", _ => {
    if(nameInput.value.trim().length > 0){
        link.classList.remove("disabled");
    }
    else{
        link.classList.add("disabled");
    }
});

nameInput.addEventListener("keyup", event => {
    if(event.keyCode === 13) link.click();
});

// Si existe nombre guardado, rellenar el input
let localSavedName = localStorage.getItem(localStorageKey);
if(localSavedName){
    nameInput.value = localSavedName;
    link.classList.remove("disabled");
}
