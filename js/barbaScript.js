// Treats both "index.html" and the directory form (URL ending in "/") as the home page
function isHomeUrl(p) {
  const last = p.split("/").pop();
  return last === "" || last === "index.html";
}

 let transitionDuration = 450;
  /*
  barba.init({
    preventRunning: true,

    transitions: [{
      name: 'fade',
      async: false,
      beforeLeave(data) { 

        window.scrollTo({top: window.innerHeight, left: 0, behavior: "smooth"});

      },
      leave(data) {
       
        data.current.container.style.opacity = 1;
        return anime({
            targets: data.current.container,
            opacity: [1, 0],
            duration: 500,
            easing: 'easeInOutQuad'
        }).finished;

      },
      afterLeave(data) {
        data.current.container.classList.add("hide");

        if (window.location.pathname.split("/").pop() == "index.html") {document.getElementById("first-section").classList.remove("hide");}
        else {document.getElementById("first-section").classList.add("hide");}

      }, 
      beforeEnter(data) {
        if (window.location.pathname.split("/").pop() == "index.html") {loadWorks();}
        window.scrollTo({top: window.innerHeight, left: 0, behavior: "instant"});

        upDateTopMenu();
      },
      enter(data) {

        data.next.container.style.opacity = 0;
        return anime({
            targets: data.next.container,
            opacity: [0, 1],
            duration: 500,
            easing: 'easeInOutQuad'
        }).finished;

    },
      afterEnter(data) {

      }
    }]
  });
  */

  let currentH, nextH;

    barba.init({
    preventRunning: true,

    transitions: [{
      name: 'fade',
      async: false,
      beforeLeave: async (data) =>  {
        if (isHomeUrl(data.current.url.path)) {
          await smoothScrollTo(window.innerHeight, 0, "smooth");
        }
        else {
          await smoothScrollTo(0, 0, "smooth");  
        }
      },

      leave(data) {

      },

      afterLeave(data) {
        //console.log("afterLeave:")
        //console.log("current " + data.current.container.offsetHeight)
        //console.log("next " + data.next.container.offsetHeight)

        //data.next.container.classList.add("hide");

      }, 

      beforeEnter: async (data) => {
        //console.log("beforeEnter:")
        //console.log("current " + data.current.container.offsetHeight)
        //console.log("next " + data.next.container.offsetHeight);

        data.next.container.style.height = 0 + "px"; //To remove jumping when waiting for loadWorks() to finished 

        if (isHomeUrl(data.next.url.path)) {
          await loadWorks();
        }

        data.next.container.style.height = null;
        
        currentH = data.current.container.offsetHeight ; //console.log("currentH: " + currentH)
        nextH = data.next.container.offsetHeight; //console.log("nextH: " + nextH)

        data.current.container.style.overflow = "hidden";
        data.next.container.style.overflow = "hidden";

        upDateTopMenu();

        data.next.container.style.height = 0 + "px"; //To remove jumping when waiting for loadWorks() to finished -> END part

        return anime({
          targets: data.current.container,
          opacity: [1, 0],
          height: [currentH + "px", ((nextH - currentH) /2) + currentH + "px"],
          duration: transitionDuration,
          easing: 'easeInQuad'
        }).finished.then(() => {
            if (isHomeUrl(data.next.url.path)) {  
              document.getElementById("first-section").classList.remove("hide");
              window.scrollTo({top: window.innerHeight, left: 0, behavior: "instant"});
    
            }
            else {
              document.getElementById("first-section").classList.add("hide");
            }
          });
      },

      enter(data) {
        //console.log("enter:")
        //console.log("current " + data.current.container.offsetHeight)
        //console.log("next " + data.next.container.offsetHeight)

        data.current.container.style.height = 0 + "px";
        data.next.container.style.height = "";

        return anime({
            targets: data.next.container,
            opacity: [0, 1],
            height: [((nextH - currentH) /2) + currentH + "px", nextH + "px"],
            duration: transitionDuration,
            easing: 'easeOutQuad'
        }).finished.then(() => {
          data.current.container.style.height = null;
          data.next.container.style.height = null;

          data.current.container.style.overflow = null;
          data.next.container.style.overflow = null;

          });

      },

      afterEnter(data) {
        //console.log("afterEnter:")
        //console.log("current " + data.current.container.offsetHeight)
        //console.log("next " + data.next.container.offsetHeight)

      },

      after(data) {
        updateTopBarWrapper();
        setupProjectNav(); // re-wire prev/next for the page just entered (window.onload does not refire under barba)
      }
    }]
  });