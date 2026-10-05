


function locomotive() {
  gsap.registerPlugin(ScrollTrigger);
  const locoScroll = new LocomotiveScroll({
    el: document.querySelector("#main"),
    smooth: true,
    smartphone: { smooth: true },
    getDirection: true
  });

  locoScroll.on("scroll", ScrollTrigger.update);

  locoScroll.on("scroll", function(dets){
    if(dets.direction === "up"){
      document.querySelector("#nav").style.top = "0%";
    }
    else if(dets.direction === "down"){
      document.querySelector("#nav").style.top = "-100%";
    }
  })

  ScrollTrigger.scrollerProxy("#main", {
    scrollTop(value) {
      return arguments.length
        ? locoScroll.scrollTo(value, 0, 0)
        : locoScroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    },
    pinType: document.querySelector("#main").style.transform ? "transform" : "fixed"
  });

  ScrollTrigger.addEventListener("refresh", () => locoScroll.update());

  ScrollTrigger.refresh();
};



function slidesHandle() {
  let allSlides = document.querySelectorAll(".sld");
  allSlides = [...allSlides];

  var isPlaying = null;
  allSlides.forEach(function (elm) {
    elm.addEventListener("mouseover", function (dets) {
      isPlaying = "#curtain" + dets.target.dataset.index;
      document.querySelector(isPlaying).style.width = "100%";
      document.querySelector("#curcularImg").style.display = "none";
    })
    elm.addEventListener("mouseleave", function (dets) {
      document.querySelector(isPlaying).style.width = "0%";
      document.querySelector("#curcularImg").style.diplay = "initial";
    })
  });



  const circle = document.querySelector("#circularImg");
  circle.addEventListener("mousemove", function (dets) {
    const bndVal = document.querySelector("#circularImg").getBoundingClientRect();
    const Xval = dets.clientX - bndVal.x;
    const Yval = dets.clientY - bndVal.y;
    document.querySelector("#dot").style.top = Yval + "px";
    document.querySelector("#dot").style.left = Xval + "px";
    document.querySelector("#dot").style.backgroundColor = "rgb(219, 255, 0)";
    document.querySelector("#dot").style.transform = "scale(1.3)";
    document.querySelector("#dot").style.boxShadow = "0 0 12px 1px rgb(219, 255, 0)";
  });

  circle.addEventListener("mouseleave", function (details) {
    document.querySelector("#dot").style.top = "50%";
    document.querySelector("#dot").style.left = "50%";
    document.querySelector("#dot").style.backgroundColor = "white";
    document.querySelector("#dot").style.transform = "scale(1)"
    document.querySelector("#dot").style.boxShadow = "none";

  });
};


// function headingAnimator(){
//   document.querySelectorAll(".allHeadings")
//         .forEach(function (row) {
//             row.innerHTML = `<div class="textwrapper">${row.innerHTML}</div>`;
//         })



//     document.querySelectorAll(".textwrapper")
//         .forEach(txt => {
//             let clutter = "";
//             txt.textContent.split(" ").forEach(wrd => {
//                 clutter += `<span>${wrd}</span>`;
//             })

//             txt.innerHTML = clutter;
//         })

//         gsap.set(".allHeadings span", {y: "200%"})

//         document.querySelectorAll(".allHeadings")
//         .forEach(function(elem){
//             gsap.from(elem, {
//                 scrollTrigger: {
//                     scroller: "#main",
//                     trigger: elem,
//                     start: "top 60%"
//                 },
//                 onStart: function(){
//                     gsap.to(elem.children[0].children, {
//                         y: 0,
//                         ease: Power4,
//                         duration: .3,
//                         stagger: .2
//                     })
//                 }
//             })
//         })

// }



function animationCode() {
  const tl = gsap.timeline();
  tl.to("#twoSlides .workSlide", {
    scrollTrigger: {
      trigger: "#twoSlides #workText",
      scroller: "#main",
      scrub: 1,
      pin: true
    },
    duration: 10000,
    top: "10%",
    stagger: 1000000,
  })
    .to(".allCircle", {
      scrollTrigger: {
        trigger: ".allTxt",
        scroller: "#main",
        pin: true,
        scrub: 1
      },
      top: "75%",
      backgroundColor: "rgb(219, 255, 0)",
      color: "black"
    })
    .to(".allTxt", {
      scrollTrigger: {
        trigger: ".allCircle",
        scroller: "#main",
        start: "top 100%",
        end: "top 0%",
        scrub: 0,
      },
      duration: 0.01,
      color: "white",
      backgroundColor: "black"
    }, "-=10s")
    .to("#allWork", {
      scrollTrigger: {
        trigger: ".allCircle",
        scroller: "#main",
        start: "top 100%",
        end: "top 0%",
        scrub: 0,
      },
      duration: 0.01,
      color: "white",
      backgroundColor: "black"
    }, "-=10s")
    .to(".allTxt h1", {
      scrollTrigger: {
        trigger: ".allCircle",
        scroller: "#main",
        start: "top 100%",
        end: "top 0%",
        scrub: 0,
      },
      duration: 0.01,
      color: "white",
    }, "-=10s");

};




locomotive();
slidesHandle();
// headingAnimator();
animationCode();