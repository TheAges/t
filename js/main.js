let workJSON;
let maxScroll;
let introStatus;

// SITE_ROOT is defined as a global in each page's <head> (inline <script>), so both main.js and main_three.js can read it regardless of defer/async load order.

// True when the current URL is the home page, both as "index.html" and as the directory form ending in "/"
function isHomePage() {
  const last = window.location.pathname.split("/").pop();
  return last === "" || last === "index.html";
}

// ---- Image lightbox with zoom (work images only) ----------------------------------
// Event-delegated on document, so it survives Barba content swaps. Targets only images
// inside #pageWork .imageWapper (work images). The hero/intro image uses .imageWapper too
// but lives in #works_info_image (outside #pageWork), so scoping to #pageWork excludes it.
// Behaviour: click image to toggle zoom (centred on the click point); move the mouse
// (or drag on touch) to pan while zoomed; click the backdrop or press Escape to close.
(function () {
  console.log("[lightbox] work-image-only build active (#pageWork .imageWapper)");
  let isZoomed = false;

  function lbImg() { return document.getElementById("imgLightboxImg"); }

  function openLightbox(src, alt) {
    const ov = document.getElementById("imgLightbox");
    if (!ov) return;
    const img = lbImg();
    img.setAttribute("src", src);
    img.setAttribute("alt", alt || "");
    resetZoom();
    ov.classList.add("is-open");
    document.body.style.overflow = "hidden"; // stop background scroll while open
  }

  function closeLightbox() {
    const ov = document.getElementById("imgLightbox");
    if (!ov) return;
    resetZoom();
    ov.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function resetZoom() {
    const img = lbImg();
    if (!img) return;
    isZoomed = false;
    img.classList.remove("is-zoomed");
    img.style.transformOrigin = "center center";
  }

  // Set the zoom focal point from a pointer position over the image (in %).
  function setOriginFromPoint(clientX, clientY) {
    const img = lbImg();
    if (!img) return;
    const r = img.getBoundingClientRect();
    let x = ((clientX - r.left) / r.width) * 100;
    let y = ((clientY - r.top) / r.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    img.style.transformOrigin = x + "% " + y + "%";
  }

  function toggleZoom(clientX, clientY) {
    const img = lbImg();
    if (!img) return;
    isZoomed = !isZoomed;
    if (isZoomed) {
      setOriginFromPoint(clientX, clientY);
      img.classList.add("is-zoomed");
    } else {
      img.classList.remove("is-zoomed");
      img.style.transformOrigin = "center center";
    }
  }

  // Click: open from a thumbnail, toggle zoom on the open image, or close on backdrop.
  document.addEventListener("click", function (e) {
    const thumb = e.target.closest("#pageWork .imageWapper img");
    if (thumb) { openLightbox(thumb.currentSrc || thumb.src, thumb.getAttribute("alt")); return; }

    const ov = document.getElementById("imgLightbox");
    if (!ov || !ov.classList.contains("is-open")) return;

    if (e.target.closest("#imgLightboxImg")) {
      toggleZoom(e.clientX, e.clientY); // clicking the image zooms, not closes
    } else if (e.target.closest("#imgLightbox")) {
      closeLightbox();                  // clicking the backdrop closes
    }
  });

  // Pan while zoomed (mouse).
  document.addEventListener("mousemove", function (e) {
    if (!isZoomed) return;
    setOriginFromPoint(e.clientX, e.clientY);
  });

  // Pan while zoomed (touch); prevent the page from scrolling under the finger.
  document.addEventListener("touchmove", function (e) {
    if (!isZoomed) return;
    const t = e.touches[0];
    if (!t) return;
    setOriginFromPoint(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });

  // Escape closes.
  document.addEventListener("keyup", function (e) {
    if (e.key === "Escape") { closeLightbox(); }
  });
})();
// -----------------------------------------------------------------------------------



// True while the intro is still playing (home page, not yet finished).
function introIsRunning() {
  return !introStatus && introScene < 7;
}

// Block NATIVE page scrolling during the intro so spamming the wheel/touch/keys cannot slide
// the document down past the still-typing text. Scene 3 scrolls the page itself via
// window.scrollTo (programmatic), which is unaffected by these preventDefault calls.
function preventIntroScroll(e) {
  if (introIsRunning()) { e.preventDefault(); }
}
function preventIntroKeyScroll(e) {
  if (!introIsRunning()) return;
  const k = e.key;
  if (k === " " || k === "Spacebar" || k === "PageDown" || k === "PageUp" ||
      k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
    e.preventDefault();
  }
}

// Main on load event

window.onload = function(event) {
  
  let currentPageName = window.location.pathname.split("/").pop()

  /*
  // --- Set the min width of all dropdown same as parent drop button

      var dropdowns = document.getElementsByClassName("dropdown-content");

      for (var i = 0; i < dropdowns.length; i++) {

          //var parentWidth = dropdowns[i].parentElement.offsetWidth;
          //console.log(parentWidth);

          dropdowns[i].style.minWidth = dropdowns[i].parentElement.offsetWidth; + "px";

      }

  // --- END --- 
  */

  //See if the intro was arlady played before (only if the page is the index one, otherwise is alewys true -> to prevent errors when swiching page with barba.js):

  if ( isHomePage() ) {
    introStatus = JSON.parse(localStorage.getItem('introShowed'));
    if (introStatus == null) {introStatus = false;}
  }
  else {introStatus = true;}

  // --- END --- 

  //Add lisserners for user input

  if (!introStatus) {
    document.body.addEventListener("click", procedIntroAnimation, false);
    document.body.addEventListener("keyup", procedIntroAnimation, false);
    document.body.addEventListener("wheel", procedIntroAnimation, false);

    // Suppress native scrolling for the duration of the intro (passive:false so preventDefault works).
    window.addEventListener("wheel", preventIntroScroll, { passive: false });
    window.addEventListener("touchmove", preventIntroScroll, { passive: false });
    window.addEventListener("keydown", preventIntroKeyScroll, false);
  }

  window.addEventListener("scroll", scrollSpy, false);

  window.addEventListener("resize", resizeSpy); //Add lisener on resized to update windows element widths

  // --- END --- 

  //Popolate works section only if the page is the index one
  
  if ( isHomePage() ) {
    loadWorks();
  }
  
  // --- END --- 

  //change opacity back to 1 if the phasing and script running has finished, and kill the loadin warning show up timeout (set in the html page)

  //document.getElementById("main").style.opacity = 1;
  //setTimeout(() => { document.getElementById("main").style.transition = "0s"; updateTopBarWrapper();}, 1000);
  document.getElementById("main").classList.remove("d-none");
  document.getElementById("main").style.animation = "fadeIn 1.2s forwards";
  //clearTimeout(loadingWarning); 
  // --- END --- 

  //Call windowAsResized at least once to set all the parameters
  updateTopBarWrapper();

  //Update top menu bar for showing the right butons
  upDateTopMenu();

  //Wire prev/next project buttons (if this is a project page)
  setupProjectNav();

}

let paragrapghTop;
let firstDivider;
let paragrapghBottom;
let aboveWorkText;

let secondSectionHeight;

let introScene = -1;
let isAnimating = false;

// Intro input gate: TRUE only when the intro is idle and ready to accept a user advance
// (the very start, and after paragraph 1 and paragraph 2 finish typing). FALSE during every
// animation and auto-advancing scene, so a scene can never be skipped by spamming input.
let awaitingUserInput = false;
let lastIntroAdvance = 0;
const INTRO_INPUT_THROTTLE = 600; // ms

function introAnimationManager(scene) {
  switch (scene) {
    case -1: //preparation for animation
        document.getElementById("paragrapghTop").classList.add("d-none");
        document.getElementById("first-divider").classList.add("d-none");
        document.getElementById("paragrapghBottom").classList.add("d-none");

        document.getElementById("second-section").classList.add("d-none");
        document.getElementById("aboveWorkText").classList.add("d-none");

        for (let item of document.getElementsByClassName("appearAble")) {
          item.classList.add("d-none");
        }

        document.getElementById("cursor").classList.remove("d-none");

        paragrapghTop = document.getElementById("paragrapghTop").innerHTML;
        firstDivider = document.getElementById("first-divider").innerHTML;
        paragrapghBottom = document.getElementById("paragrapghBottom").innerHTML;
        aboveWorkText = document.getElementById("aboveWorkText").innerHTML;
      
        paragrapghTop.innerHTML = "";
        firstDivider.innerHTML = "";
        paragrapghBottom.innerHTML = "";

        aboveWorkText.innerHTML = "";

        awaitingUserInput = true; // ready to accept the first user advance (-1 -> 0)
      break;

    case 0: //First parahrapher
        document.getElementById("paragrapghTop").classList.remove("d-none");
        typeWriter("paragrapghTop", paragrapghTop);
      break;

    case 1: //diver line animation
        document.getElementById("first-divider").classList.remove("d-none");
        typeWriter("first-divider", firstDivider, () => {
          // advance to scene 2 ONLY after the divider has fully typed
          introScene++;
          introAnimationManager(introScene);
        });
      break;
  
    case 2: //Second parahrapher
        document.getElementById("paragrapghBottom").classList.remove("d-none");
        typeWriter("paragrapghBottom", paragrapghBottom);
      break;

    case 3: //Scroll to second section
        document.getElementById("second-section").classList.remove("d-none");
        updateTopBarWrapper();
        maxScroll = Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ) - window.innerHeight;
        steppedScrolling(maxScroll);
      break;

    case 4: //positionated cursor at top of the page
      document.getElementById("cursor").style.animation = "blinking 1s linear 0s infinite normal";

      isAnimating = true; // stay locked through the cursor-reposition pause and into scene 5

      setTimeout(() => {
        document.getElementById("aboveWorkText").classList.remove("d-none");
        document.getElementById("aboveWorkText").innerHTML = "";

        document.getElementById("cursor").style.top = document.getElementById("aboveWorkText").getBoundingClientRect().top + "px";
        document.getElementById("cursor").style.left = document.getElementById("aboveWorkText").getBoundingClientRect().left + "px";

        document.getElementById("cursor").style.paddingTop = window.getComputedStyle(document.getElementById("paragrapghBottom"), null).getPropertyValue('padding-top');
        document.getElementById("cursor").style.paddingLeft = 0 + "px";
      }, 200);

      introScene++; //Automatically advance to next scene
      setTimeout(() => { introAnimationManager(introScene); }, 1200);

    break;


    case 5: //aboveWorks Text
      document.getElementById("cursor").classList.add("d-hide");
      document.getElementById("cursor").classList.add("d-none");

      typeWriter("aboveWorkText", aboveWorkText, () => {
        // launch the appear animation ONLY after the text has fully typed
        introScene++;
        introAnimationManager(introScene);
      });
    break;


    case 6: //Lunch the appear animation for each element
      appearAnimation();
    break;

    case 7: //Last act
      introStatus = true;
      localStorage.setItem("introShowed", JSON.stringify(introStatus));
      //console.log("intro as finished");

      document.getElementById("cursor").classList.add("d-none");
    break;

    default:
        console.log("introAnimationScene not reconized")
    break;
  }
}

function procedIntroAnimation() {
  // Advance ONLY when the intro is genuinely waiting for the user. The gate is consumed
  // immediately, so a whole burst of wheel/key events yields exactly one advance, and the
  // auto-advancing scenes (divider, scroll, final text, appear) can never be interrupted.
  if (!awaitingUserInput) return;

  const now = Date.now();
  if (now - lastIntroAdvance < INTRO_INPUT_THROTTLE) return; // guard against double-fire

  awaitingUserInput = false; // consume; nothing else accepted until the next wait point reopens it
  lastIntroAdvance = now;
  introScene++;
  introAnimationManager(introScene);
}

var minTyperSpeed = 30;
var maxTyperSpeed = 2000;

function typeWriter(obj_id, txt_to_write, onComplete) {
  var t = 0;

  isAnimating = true;

  document.getElementById(obj_id).innerHTML = ""; //remove content of id object if there's some

  document.getElementById("cursor").classList.add("hide");

  let textSpace = document.getElementById(obj_id).appendChild( document.createElement("span")); //create span for the text
  let cursorSpace = document.getElementById(obj_id).appendChild( document.createElement("span")); //create span for the cursor
  
  cursorSpace.innerHTML += " &#9608"; //add the cursor
  
  //let textSpace = document.getElementById(obj_id); //get object for text injection

  typerLoop();

  function typerLoop() {
    if (t < txt_to_write.length) {
      textSpace.innerHTML += txt_to_write.charAt(t);
      t++;
      setTimeout(function() { typerLoop(); }, Math.random(maxTyperSpeed - minTyperSpeed)+minTyperSpeed);
    }
    else { // runs EXACTLY ONCE when typing is done (was a second `if`, which fired completion twice -> double scene-advance)

      cursorSpace.remove();
      document.getElementById("cursor").classList.remove("hide");

      isAnimating = false;
      lastIntroAdvance = Date.now();

      if (typeof onComplete === "function") {
        onComplete();              // auto-advance scenes: divider -> scene 2, final text -> appear
      } else {
        awaitingUserInput = true;  // manual-wait paragraphs (scene 0 and scene 2): accept next advance
      }
    };
  }
}

let maxsteppedScrollingSpeed = 50;
let singleScrollingOffset = 30;

function steppedScrolling(targetY) {

  isAnimating = true;

  document.getElementById("cursor").style.top = document.getElementById("cursor").getBoundingClientRect().x;
  document.getElementById("cursor").style.left = document.getElementById("cursor").getBoundingClientRect().y;
  document.getElementById("cursor").style.position = "fixed";

  document.getElementById("cursor").style.animationIterationCount = "0";

  var loop = setInterval(() => { steppedScrollingLoop() }, maxsteppedScrollingSpeed);

  function  steppedScrollingLoop() {
    //window.scrollBy(0, singleScrollingOffset);
    window.scrollTo({top: document.documentElement.scrollTop + singleScrollingOffset, left: 0, behavior: "instant", });
    //document.documentElement.scrollTop += singleScrollingOffset;
    

    if (targetY <= window.scrollY) { //AGGIUNGERE FALLBACK SE NON RIESCIE A RAGGIUNGERE LA Y PER QUALCHE MOTIVO

      //document.getElementById("cursor").style.animationIterationCount = "infinite";

      clearInterval(loop);

      introScene++;
      introAnimationManager(introScene);
      //setTimeout(() => { isAnimating = true;  introAnimationManager(introScene); isAnimating = false; }, 1000);
      
      isAnimating = false;
    }
  }

}

let appearItemDelay = 100;

function appearAnimation() {
  var i = 0;

  isAnimating = true;

  currentItemList = document.getElementsByClassName("appearAble");
  
  appearLoop();

  function appearLoop() {
    if (i <= currentItemList.length-1) {
      currentItemList[i].classList.remove("d-none");

      //Unlock second-section height when the visualized element under the viewport, this is needed prevent the viewport to jump to 0 when the animated element are still to in the viewport
      if (currentItemList[i].getBoundingClientRect().top > window.innerHeight) {
        document.getElementById("second-section").style.height = "initial";
      }

      setTimeout(function() { appearLoop(); }, appearItemDelay);
      i++;
    }
    else {
      isAnimating = false;
      
      introScene++;
      introAnimationManager(introScene);
    };
  }

}

/*

// Toggle between hiding and showing the dropdown content

function openDropdown(id_dropdown) {
    document.getElementById(id_dropdown).classList.toggle("show_dropdown");
  }
  
// Close the dropdown menu if the user clicks outside of it
  
window.onclick = function(event) {
    if (!event.target.matches('.drop-button')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show_dropdown')) {
          openDropdown.classList.remove('show_dropdown');
        }
      }
    }
  }

  */


// ---- Project prev/next navigation -------------------------------------------------
// Ordered, visible work keys come from Porfolio_Works.json (same source as the homepage),
// so prev/next follows the homepage order and never lands on a hidden/archived entry.
// We reuse changePage(key), which sets the colour tween and calls barba.go, so prev/next
// inherits the exact same scroll-to-top + fade transition as the nav menu.

let worksOrderCache = null; // array of visible keys in order

function ensureWorksOrder() {
  // Resolve to the ordered array of visible work keys, fetching the JSON once if needed.
  if (worksOrderCache) { return Promise.resolve(worksOrderCache); }
  if (typeof workJSON !== "undefined" && workJSON) {
    worksOrderCache = orderedVisibleKeys(workJSON);
    return Promise.resolve(worksOrderCache);
  }
  return fetch(SITE_ROOT + "res/Porfolio_Works.json")
    .then(r => r.json())
    .then(data => { workJSON = data; worksOrderCache = orderedVisibleKeys(data); return worksOrderCache; })
    .catch(err => { console.error("prev/next: could not load works list", err); return []; });
}

function orderedVisibleKeys(json) {
  // Preserve JSON insertion order; keep only visible, non-archived entries.
  return Object.keys(json).filter(k => {
    const w = json[k];
    return w && w.Is_visible !== false && w.Is_archived !== true && k !== "proto_work";
  });
}

function setupProjectNav() {
  const host = document.querySelector("[data-work-key]");
  if (!host) { return; } // not a project page
  const currentKey = host.getAttribute("data-work-key");

  const prevBtn = document.getElementById("projNavPrev");
  const nextBtn = document.getElementById("projNavNext");
  if (!prevBtn || !nextBtn) { return; }

  ensureWorksOrder().then(order => {
    if (!order || order.length === 0) { return; }
    let i = order.indexOf(currentKey);
    if (i === -1) { return; } // current page not in list; leave buttons inert

    const prevKey = order[(i - 1 + order.length) % order.length]; // wrap-around
    const nextKey = order[(i + 1) % order.length];

    prevBtn.setAttribute("onclick", "changePage('" + prevKey + "')");
    nextBtn.setAttribute("onclick", "changePage('" + nextKey + "')");
  });
}
// -----------------------------------------------------------------------------------

  function loadWorks() {

  return new Promise((resolve, reject) => {

    //Clean works container
    document.getElementById("works_container").innerHTML = "";

    //Load JSON works
    fetch(SITE_ROOT + "res/Porfolio_Works.json")
      .then(response => response.json())
      .then(data => {
        //console.log(data);
        workJSON = data;
        
        //Inject them in the page
        popolateWorksList();
        updateTopBarWrapper(); //Call the resize function to update the generetaed part 

        if (!introStatus) {introAnimationManager(introScene);} //Start the intro animation after the JSON has finished to load
      
        resolve();

      })
      .then()
      .catch(error => {
        console.error('Error:', error);

        reject(error);

      });
    })
  }

  function popolateWorksList() {

    for (const [key, value] of Object.entries(workJSON)) {
      if (key != "proto_work") {buildWorkItem(key, value)};
    }

    function buildWorkItem(k, w) {

      let  placeholderAppearAnim;

      if (!introStatus) {placeholderAppearAnim = "appearAble"} //Start the intro animation after the JSON has finished to load
      else { placeholderAppearAnim = ""}


      let ancorPlaceholderTOP, ancorPlaceholderBOTTOM;

    /*
      if (w.Webpage_available) {
        ancorPlaceholderTOP = '<a href=' + w.Webpage_url + ' class="link-dark" >';
        ancorPlaceholderBOTTOM = '</a>';
      }
      else {
        ancorPlaceholderTOP = "";
        ancorPlaceholderBOTTOM = "";
      }
    */

      document.getElementById("works_container").innerHTML += 

    '<div onclick="changePage('+ "'" + k + "'" + ')" class="work_item hoverable ' + placeholderAppearAnim + ' ">'+
      //ancorPlaceholderTOP +
        '<div class="row align-items-center">'+
          '<div class="work_title col-12 col-sm-12 col-md-7 col-lg-12 col-xxl-8">'+
            '<span>' + w.Title + '</span>'+
          '</div>'+
          '<div class="col-12 col-sm-12 col-md-5 col-lg-12 col-xxl-4 text-start text-md-end text-lg-start text-xxl-end">'+
            '<div class="work_cat">'+
              '<span>' + w.Category + '</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
      //ancorPlaceholderBOTTOM +
    '</div>';

      /*
      '<div class="work_item hoverable">'+
        '<div class="row align-items-center">'+
          '<div class="work_title col-12 col-sm-12 col-md-8 col-lg-9 col-xl-8">'+
            '<span>' + w.Title + '</span>'+
          '</div>'+
          '<div class="col-12 col-sm-12 col-md-4 col-lg-3 col-xl-4">'+
            '<div class="row">'+
              '<div class="work_year col-12 col-sm-12 col-md-12 col-lg-12 col-xl-6">'+
              '<span>Year</span> <span>' + w.Start_year + '</span>'+
              '</div>'+
              '<div class="work_cat col-12 col-sm-12 col-md-12 col-lg-12 col-xl-6">'+
                '<span>Category: </span> <span>' + w.Category + '</span>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
      */

      /*
      '<div class="work_item hoverable">'+
      '<div class="row">'+

          '<div class="work_text_col col-12 col-sm-6 col-lg-8 col-xs-9">'+

            '<div class="work_first_row row ">'+
              '<div class="col-12">'+
                '<span>'+w.Title+'</span>'+
              '</div>'+
            '</div>'+

            '<div class="work_second_row row ">'+
              '<div class="col-12 d-none d-sm-none d-md-block d-lg-none d-xl-block">'+
                '<span>'+w.Short_description+'</span>'+
              '</div>'+
            '</div>'+

            '<div class="work_third_row row align-content-end">'+
              '<div class="col-12">'+
                '<span>Year: </span> <span>'+w.Start_year+'</span>'+
              '</div>'+
              '<div class="col-12 tags_container">'+
                '<span>Tags: </span> <span id="tag-placeholder"></span>'+
              '</div>'+
            '</div>'+

          '</div>'+

          '<div class="col-12 col-sm-6 col-lg-4 col-xs-3">'+
            '<div class="work_img_col">'+
              '<img src="'+w.Cover_image_url+'" alt="'+w.Cover_image_description+'" >'+
            '</div>'+
          '</div>'+

        '</div>'+
      '</div>'
      ;
      

      w.Tags.forEach(tag => {
        document.getElementById("tag-placeholder").innerHTML += '<span class="tag">'+ tag +'</span>';
      });

      document.getElementById("tag-placeholder").removeAttribute('id');
      */
    }
  }

  function resizeSpy() {
    updateTopBarWrapper();
  }

  function updateTopBarWrapper() {
    //Resize topBar-Wrapper to match the second-section width and height
    document.getElementById("topBar-Wrapper").style.width = document.getElementById("belowTopbar-Wrapper").offsetWidth + "px";
    document.getElementById("topBar-Wrapper").style.height = document.getElementById("belowTopbar-Wrapper").offsetHeight + "px";
  
  }

  function scrollSpy() {
    if (document.getElementById("nav-menu-BG").getBoundingClientRect().top == 0) {
      if (!document.getElementById("nav-menu-BG").classList.contains("is-pinned")) {
        //console.log("PINNED");
        document.getElementById("nav-menu-BG").classList.add("is-pinned");
      };
    }
    else {
      if (document.getElementById("nav-menu-BG").classList.contains("is-pinned")) {
        //console.log("UNPINNED");
        document.getElementById("nav-menu-BG").classList.remove("is-pinned");
      };
    };
  }


  let currentAccentColor = standardize_color(window.getComputedStyle(document.documentElement).getPropertyValue('--main-accent-color'));
  let currentBackgroundColor = standardize_color(window.getComputedStyle(document.documentElement).getPropertyValue('--main-bg-color'));

  function upDateTopMenu() {
    let pageName = window.location.pathname.split("/").pop(); 
    //console.log(pageName);
    
    //Hide all the menu items, so later only the right one could be showed later
    document.getElementById("homeMenuButton-works").classList.add("hide")
    document.getElementById("homeMenuButton-about").classList.add("hide")

    document.getElementById("aboutMenuButton").classList.add("hide")
    
    //document.getElementById("contactsMenuButton").classList.add("hide")


    //Based on the page, show the right one
    switch (pageName) {
      case "":
      case "index.html":
        document.getElementById("aboutMenuButton").classList.remove("hide")
        break;
      case "about.html":
        document.getElementById("homeMenuButton-about").classList.remove("hide")
        break;
      default: //other pages
        document.getElementById("homeMenuButton-works").classList.remove("hide")
        document.getElementById("aboutMenuButton").classList.remove("hide")

        /*
        document.getElementById("homeMenuButton-works").animate(
          [
            { width: 0+"px", opacity: 0},
            { width: document.getElementById('homeMenuButton-works').offsetWidth + "px", opacity: 1}
          ], {
            duration: 450
          }
        );
        */

        break;
    }

    /*
    //do the aniamtion to hide chages in position
    document.getElementById("nav-menu").animate(
      [
        { backgroundColor: currentAccentColor },
        { backgroundColor: currentBackgroundColor }
      ], {
        duration: 200
      }
    );
    */

  }


  function goOnTOP() {
    window.scrollTo({top: 0, left: 0, behavior: "smooth"});
  }

  function restartALL() {
    localStorage.removeItem("introShowed");
    window.location.href = SITE_ROOT + "index.html";
  }

  function changePage(w) {
    
    changeAccentColor(workJSON[w].Accent_page_color)
    changeBgLineColor( workJSON[w].Background_Line_color )
    changeBgColor( workJSON[w].Background_color )

    if (workJSON[w].Webpage_available) {
      barba.go(SITE_ROOT + workJSON[w].Webpage_url);
    }
    else {
      console.warn("the work page is not available"); 
    }

  }

  function goToHomepage() {
    changeAccentColor("#000000")
    changeBgLineColor("#999999")
    changeBgColor("#FFFFFF")

    barba.go(SITE_ROOT + "index.html");
  }

  function goToAboutpage() {
    changeAccentColor("#000000")
    changeBgLineColor("#999999")
    changeBgColor("#FFFFFF")

    barba.go(SITE_ROOT + "pages/about.html");
  }

  let contactsAreOpen = false;
  let isContacsClosingAnimationRunning = false;
  let contacsAnimationTime = 0.4;

  function toggleContacts() {

    contactsAreOpen = !contactsAreOpen;

    if (contactsAreOpen) {  //Open conntacts

      if (isContacsClosingAnimationRunning) {clearTimeout(closeContactsTimeout);}; //Needed to prevent stuttering from animation on rapid clicking

      document.getElementById("contacts-wrapper").classList.remove("d-none");
  
  
      let h = document.getElementById('contacts-panel').offsetHeight;
      let w = document.getElementById('contacts-panel').offsetWidth;
  
      document.getElementById("contacts-background").style.transition = "0s";
      document.getElementById("contacts-panel").style.transition = "0s";
  
      document.getElementById("contacts-background").style.backgroundColor = currentBackgroundColor + "00";
      document.getElementById("contacts-background").style.backdropFilter = "blur(0px)"
      document.getElementById("contacts-panel").style.clipPath = "inset("+ h/2 +"px "+ w/2 +"px "+ h/2 +"px "+ w/2 +"px)"
  
      
      document.getElementById("contacts-background").style.transition = "background-color " + contacsAnimationTime + "s";
      document.getElementById("contacts-panel").style.transition = contacsAnimationTime + "s";
      document.getElementById("contacts-panel").style.transitionTimingFunction = "linear";
  
      document.getElementById("contacts-background").style.backgroundColor = currentBackgroundColor + "70";
      document.getElementById("contacts-background").style.backdropFilter = "blur(6px)"
      document.getElementById("contacts-panel").style.clipPath = "inset(0px 0px 0px 0px)"

      //document.getElementById('contacts-background').setAttribute("onclick","toggleContacts()');"); -> To check why does not work
    }

    else { //Close conntacts
      
      let currentAccentColor = standardize_color(window.getComputedStyle(document.documentElement).getPropertyValue('--main-accent-color'));
      let currentBackgroundColor = standardize_color(window.getComputedStyle(document.documentElement).getPropertyValue('--main-bg-color'));

      document.getElementById("contacts-background").style.backgroundColor = currentBackgroundColor + "00";
      document.getElementById("contacts-background").style.backdropFilter = "blur(0px)"
      document.getElementById("contacts-panel").style.clipPath = "inset(50% 50%)"
      
      //document.getElementById("contacts-panel").style.clipPath = "inset("+ h/2 +"px "+ w/2 +"px "+ h/2 +"px "+ w/2 +"px)"
      
      //let h = document.getElementById('contacts-panel').offsetHeight;
      //let w = document.getElementById('contacts-panel').offsetWidth;

      //document.getElementById('contacts-background').removeAttribute("onclick"); // remove onclick on contacts background element to prevent from dubble click that would reopen the concats window
  
      isContacsClosingAnimationRunning = true;
      closeContactsTimeout = setTimeout(function(){ document.getElementById("contacts-wrapper").classList.add("d-none"); isContacsClosingAnimationRunning = false; }, contacsAnimationTime * 1000);

    }
    
  }

  function matchContactsPanelBorder () {
    document.getElementById("contacts-panel-border").style.top = document.getElementById("contacts-panel").getBoundingClientRect().top +"px";
    document.getElementById("contacts-panel-border").style.left = document.getElementById("contacts-panel").getBoundingClientRect().left +"px";
    document.getElementById("contacts-panel-border").style.width = document.getElementById("contacts-panel").getBoundingClientRect().width +"px";
    document.getElementById("contacts-panel-border").style.height = document.getElementById("contacts-panel").getBoundingClientRect().height +"px";
  }

  function rgbToHex(input) {
    let colorsOnly = input.substring(
          input.indexOf('(') + 1,
          input.lastIndexOf(')')
        ).split(/,\s*/),
        
      r = colorsOnly[0],
      g = colorsOnly[1],
      b = colorsOnly[2];
      if (colorsOnly.length == 4) {a = colorsOnly[3];};

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);


          
    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }
  }

  function standardize_color(str){
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = str;
    return ctx.fillStyle;
}



function smoothScrollTo(top, left, behavior) {
  return new Promise((resolve) => {
    let scrollOptions = { top, left, behavior };
    var scrollTimeout;

    if (behavior === 'smooth') {
      const onScroll = () => {
        clearTimeout(scrollTimeout);

        if (Math.abs(window.scrollY - top) < 1 && Math.abs(window.scrollX - left) < 1) { // Allow for a small margin of error
          window.removeEventListener('scroll', onScroll);
          resolve();
        }

      };

      window.addEventListener('scroll', onScroll);
      
      scrollTimeout = setTimeout(function() {
        window.removeEventListener('scroll', onScroll);
        resolve();
      }, 100);

    } 
    else {
      resolve();
    }

    window.scrollTo(scrollOptions);
  });
}

//