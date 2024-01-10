import $ from "jquery";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { l, describeArc } from "./helpers";

gsap.registerPlugin(ScrollToPlugin);

import "./sass/style.sass";
window.$ = $;
window.ctl = [];

// Menu
let container = $(".custom-menu-anim"),
  maxScroll = container[0].scrollWidth - container.outerWidth(),
  menuItems = $(".menu-item-outer"),
  lines = $(".menu-item-line"),
  menuArr = [],
  currLine,
  prevLine,
  currIdx,
  currChild,
  tlTimeout;

class HoverButton {
  constructor(el) {
    this.el = el;
    this.hover = false;
    this.mouseOnParent = false;
    this.mouseOnChild = false;
    this.imageEl = $(this.el).find(".menu-item-image");
    this.titleEl = $(this.el).find(".menu-item-name");
    this.children = $(this.el).find(".menu-item-child");
    this.childLines = $(this.el).find(".menu-item-child-line");
    this.childTitles = $(this.el).find(".menu-item-child h2");
    this.init();
  }

  init() {
    this.calculatePosition();
    this.attachEvents();
  }

  createTl() {
    this.childTl = gsap.timeline({
      paused: true,
    });

    if (this.children.length) {
      window.ctl.push(this.childTl);
      const widths = this.childLines.toArray().map((c) => c.fullWidth);
      this.childTl
        .fromTo(
          this.childLines,
          { width: 0 },
          {
            width: gsap.utils.wrap(widths),
            duration: 0.2,
            stagger: 0.05,
            ease: "power2.out",
          }
        )
        .fromTo(
          this.children,
          {
            scale: 0,
          },
          {
            duration: 0.2,
            stagger: 0.05,
            scale: 1,
            ease: "power2.out",
          }
        )
        .fromTo(
          this.childTitles,
          {
            x: -25,
            opacity: 0,
          },
          {
            duration: 0.2,
            x: 0,
            opacity: 1,
            ease: "power2.out",
          }
        );
    }
  }

  attachEvents() {
    container
      .on("mousemove", (e) => this.onMouseMove(e))
      .on("resize", (e) => this.calculatePosition());

    this.imageEl
      .on("mouseenter", (e) => this.onMouseEnter())
      .on("mouseleave", (e) => this.onMouseLeave())
      .on("click", (e) => this.navigateTo(e));

    this.children
      .on("mouseenter", (e) => this.onChildMouseEnter(e))
      .on("mouseleave", (e) => this.onChildMouseLeave())
      // .on("mouseleave", e => this.onMouseLeave())
      .on("click", (e) => this.navigateTo(e));

    this.titleEl.on("click", (e) => this.navigateTo(e, true));
  }

  calculatePosition() {
    const box = this.el.getBoundingClientRect();
    this.baseX = box.left + box.width * 0.5;
    this.baseY = box.top + box.height * 0.5;
    this.x = this.baseX;
    this.y = this.baseY;
    this.width = box.width;
    this.height = box.height;
  }

  onMouseMove(e) {
    this.x = this.baseX - container.scrollLeft();
    $(this.el)
      .find(".menu-item-child")
      .each(function (child) {
        this.x = this.baseX - container.scrollLeft();
      });

    let hover = false,
      hoverArea = this.hover ? 0.65 : 0.55,
      x = e.clientX - this.x,
      y = e.clientY - this.y,
      distance = Math.sqrt(x * x + y * y);

    if (distance < this.width * hoverArea) {
      hover = true;
      if (!this.hover) {
        this.hover = true;
      }
      this.onHover(e.clientX, e.clientY);
    }

    if (!hover && this.hover) {
      this.onLeave();
      this.hover = false;
    }
  }

  onHover(x, y) {
    currIdx = menuItems.index(this.el);
    let idx = currIdx,
      newX = (x - this.x) * 0.4,
      newY = (y - this.y) * 0.4;

    gsap.to($(".menu-item-desc").eq(idx), {
      duration: 0.7,
      x: (x - this.x) * 0.4,
      y: (y - this.y) * 0.4,
      scale: 1.1,
      ease: "power2.out",
    });

    gsap.to($(".menu-item-image").eq(idx), {
      duration: 0.7,
      border: "10px solid #0597ab",
      opacity: 1,
      ease: "power2.out",
    });

    gsap.to($(".menu-item-name").eq(idx), {
      duration: 0.7,
      delay: 0.1,
      x: (x - this.x) * 0.4,
      y: (y - this.y) * 0.4,
      ease: "power2.out",
    });

    if (idx === 0) {
      currLine = lines.eq(idx);

      // Line to right of circle
      let x1 = newX + this.x,
        y1 = newY + this.y,
        x2 = menuArr[idx + 1].x,
        y2 = menuArr[idx + 1].y;

      gsap.to(currLine, {
        duration: 0.7,
        x: newX,
        y: newY,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });
    } else if (idx === menuItems.length - 1) {
      prevLine = lines.eq(lines.length - 1); // Only n-1 lines

      let x1 = menuArr[idx - 1].x,
        y1 = menuArr[idx - 1].y,
        x2 = newX + this.x,
        y2 = newY + this.y;

      gsap.to(prevLine, {
        duration: 0.7,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });
    } else {
      currLine = lines.eq(idx);
      prevLine = lines.eq(idx - 1);

      // Line to right of circle
      let x1 = newX + this.x,
        y1 = newY + this.y,
        x2 = menuArr[idx + 1].x,
        y2 = menuArr[idx + 1].y;

      gsap.to(currLine, {
        duration: 0.7,
        x: newX,
        y: newY,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });

      // Line to left of circle
      (x1 = menuArr[idx - 1].x),
        (y1 = menuArr[idx - 1].y),
        (x2 = newX + this.x),
        (y2 = newY + this.y);

      gsap.to(prevLine, {
        duration: 0.7,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });
    }
  }

  onLeave() {
    // l("leave")
    gsap.to($(".menu-item-desc"), {
      duration: 0.7,
      x: 0,
      y: 0,
      scale: 1,
      ease: "power2.out",
    });

    gsap.to($(".menu-item-image"), {
      duration: 0.7,
      border: "0px solid #0597ab",
      opacity: 0.7,
      ease: "power2.out",
    });

    gsap.to($(".menu-item-name"), {
      duration: 0.7,
      delay: 0.1,
      x: 0,
      y: 0,
      ease: "power2.out",
    });

    let idx = currIdx;
    if (idx === 0) {
      let x1 = menuArr[idx].x,
        y1 = menuArr[idx].y,
        x2 = menuArr[idx + 1].x,
        y2 = menuArr[idx + 1].y;

      gsap.to(currLine, {
        duration: 0.7,
        x: 0,
        y: 0,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });
    } else if (idx === menuItems.length - 1) {
      let x1 = menuArr[idx - 1].x,
        y1 = menuArr[idx - 1].y,
        x2 = menuArr[idx].x,
        y2 = menuArr[idx].y;

      gsap.to(prevLine, {
        duration: 0.7,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });
    } else {
      let x1 = menuArr[idx].x,
        y1 = menuArr[idx].y,
        x2 = menuArr[idx + 1].x,
        y2 = menuArr[idx + 1].y;

      gsap.to(currLine, {
        duration: 0.7,
        x: 0,
        y: 0,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });

      (x1 = menuArr[idx - 1].x),
        (y1 = menuArr[idx - 1].y),
        (x2 = menuArr[idx].x),
        (y2 = menuArr[idx].y);

      gsap.to(prevLine, {
        duration: 0.7,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "power2.out",
      });
    }
  }

  onMouseEnter() {
    // l("onMouseEnter")
    this.mouseOnParent = true;
    // if (this.children.length && this.childTl && this.childTl.progress() === 0) {
    if (this.children.length) {
      this.childTl.play();
    }
  }

  onMouseLeave() {
    // l("onMouseLeave")
    this.mouseOnParent = false;
    tlTimeout = setTimeout(() => {
      if (!this.mouseOnChild && !this.mouseOnParent) {
        this.childTl.reverse();
      }
    }, 2000);
  }

  onChildMouseEnter(e) {
    clearTimeout(tlTimeout);
    this.mouseOnChild = true;
    currChild = $(e.currentTarget);
    gsap.to(currChild, {
      duration: 0.3,
      scale: 1.1,
    });
  }

  onChildMouseLeave() {
    // l("onChildMouseLeave")
    this.mouseOnChild = false;
    gsap.to(currChild, {
      duration: 0.1,
      scale: 1,
      onComplete: () => {
        tlTimeout = setTimeout(() => {
          if (!this.mouseOnChild && !this.mouseOnParent) {
            this.childTl.reverse();
          }
        }, 2000);
      },
    });
  }

  navigateTo(e, fromTitle) {
    let url;

    if (fromTitle) {
      url = $(e.currentTarget)
        .siblings(".menu-item-desc")
        .find(".menu-item-image")
        .data("url");
    } else {
      url = $(e.currentTarget).data("url");
    }
    // l(url)
    window.location.href = url;
  }
}

class MenuTransition {
  constructor() {
    l("menuTr init");
  }

  animate() {
    // Menu
    this.animateMenu();

    // Logo
    this.animateLogo();
  }

  animateMenu() {
    // Move menu
    container.on("mousemove", function (e) {
      let ratio = e.clientX / $(this).width();
      // $(this).scrollLeft(maxScroll * ratio);
      gsap.to($(this), {
        duration: 1,
        scrollTo: { x: maxScroll * ratio },
        ease: "power2",
      });

      gsap.to(".custom-menu-anim", {
        duration: 2,
        backgroundPosition: `50% ${40 + ratio * 10}%`,
        ease: "power2",
      });
    });

    // Create menu items
    menuItems.toArray().forEach((item) => menuArr.push(new HoverButton(item)));

    // Draw lines between items
    lines.toArray().forEach((item, idx) => {
      let x1 = menuArr[idx].x,
        y1 = menuArr[idx].y,
        x2 = menuArr[idx + 1].x,
        y2 = menuArr[idx + 1].y;

      gsap.set(item, {
        css: {
          width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
          rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        },
      });
    });

    // Submenu items and lines
    menuArr.forEach((menuItem, idx) => {
      let children = $(menuItem.el).find(".menu-item-child"),
        childLines = $(menuItem.el).find(".menu-item-child-line");

      switch (idx + 1) {
        case 1:
          break;
        case 2:
          break;
        case 3:
          children.eq(0).css({
            left: "-50%",
          });

          children.eq(1).css({
            left: "125%",
            top: "-25%",
          });
          break;
        case 4:
          children.eq(0).css({
            left: "20%",
            top: "135%",
          });

          children.eq(1).css({
            left: "55%",
            top: "-70%",
          });

          children.eq(2).css({
            left: "125%",
            top: "-25%",
          });
          break;
        case 5:
          break;
        case 6:
          break;
        case 7:
          children.eq(0).css({
            left: "50%",
            top: "150%",
          });

          children.eq(1).css({
            left: "30%",
            top: "-170%",
          });
          break;
        case 8:
          break;
        case 9:
          break;
      }

      this.setPositions(children.toArray());
      this.setChildLines(menuItem, children.toArray(), childLines);
      menuItem.createTl();
    });
  }

  animateLogo() {
    $("svg.header-logo path.arc0").attr("d", describeArc(233, 183, 75, 15, 45));
    $("svg.header-logo path.arc1").attr("d", describeArc(233, 183, 98, 15, 45));
    $("svg.header-logo path.arc2").attr(
      "d",
      describeArc(233, 183, 140, 15, 45)
    );

    let eyeTl,
      lightTl,
      legsTl,
      radObj = [{ r: 75 }, { r: 98 }, { r: 140 }],
      strObj = [{ s: 0 }, { s: 20 }, { s: 30 }];

    const menuOpenTl = gsap
      .timeline({
        paused: true,
        onComplete: () => {
          gsap.set(".custom-menu-anim", {
            pointerEvents: "auto",
          });
        },
        onReverseComplete: () => {
          gsap.set(".custom-menu-anim", {
            pointerEvents: "none",
          });
        },
      })
      .to(".ripple", {
        duration: 0.4,
        scale: 30,
      })
      .to(".custom-menu-anim", {
        duration: 1,
        opacity: 1,
      });
    window.menuOpenTl = menuOpenTl;

    $(".ctn-anim").on({
      click: (e) => {
        menuOpenTl.timeScale(1).play();
      },
      mouseenter: (e) => {
        eyeTl = gsap
          .timeline()
          .to("img.e1", { duration: 0.1, scaleY: 0.2, y: -35 })
          .to("img.e1", { duration: 0.1, delay: 0.1, scaleY: 1 });

        lightTl = gsap
          .timeline()
          .to(
            strObj[2],
            {
              duration: 0.2,
              s: 0,
              onUpdate: function () {
                $("svg.header-logo path.arc2").attr(
                  "stroke-width",
                  this.targets()[0].s
                );
              },
            },
            "l0"
          )
          .to(
            radObj[2],
            {
              duration: 0.2,
              r: 160,
              onUpdate: function () {
                $("svg.header-logo path.arc2").attr(
                  "d",
                  describeArc(233, 183, this.targets()[0].r, 15, 45)
                );
              },
            },
            "l0"
          )
          .to(
            strObj[1],
            {
              duration: 0.2,
              s: 30,
              onUpdate: function () {
                $("svg.header-logo path.arc1").attr(
                  "stroke-width",
                  this.targets()[0].s
                );
              },
            },
            "l0"
          )
          .to(
            radObj[1],
            {
              duration: 0.2,
              r: 140,
              onUpdate: function () {
                $("svg.header-logo path.arc1").attr(
                  "d",
                  describeArc(233, 183, this.targets()[0].r, 15, 45)
                );
              },
            },
            "l0"
          )
          .to(
            strObj[1],
            {
              duration: 0.2,
              s: 0,
              onUpdate: function () {
                $("svg.header-logo path.arc1").attr(
                  "stroke-width",
                  this.targets()[0].s
                );
              },
            },
            "l1"
          )
          .to(
            radObj[1],
            {
              duration: 0.2,
              r: 160,
              onUpdate: function () {
                $("svg.header-logo path.arc1").attr(
                  "d",
                  describeArc(233, 183, this.targets()[0].r, 15, 45)
                );
              },
            },
            "l1"
          )
          .to(
            strObj[0],
            {
              duration: 0.3,
              s: 30,
              onUpdate: function () {
                $("svg.header-logo path.arc0").attr(
                  "stroke-width",
                  this.targets()[0].s
                );
              },
            },
            "l1"
          )
          .to(
            radObj[0],
            {
              duration: 0.3,
              r: 140,
              onUpdate: function () {
                $("svg.header-logo path.arc0").attr(
                  "d",
                  describeArc(233, 183, this.targets()[0].r, 15, 45)
                );
              },
            },
            "l1"
          );

        legsTl = gsap
          .timeline()
          .to(
            "img.l1",
            {
              duration: 0.3,
              rotationZ: -5,
              ease: "back.in",
            },
            "l0"
          )
          .to(
            "img.l2",
            {
              // delay: .05,
              duration: 0.3,
              rotationZ: -3,
              ease: "back.in",
            },
            "l0"
          )
          .to(
            "img.l3",
            {
              duration: 0.3,
              rotationZ: 5,
              ease: "back.in",
            },
            "l0"
          )
          .to(
            "img.l1",
            {
              duration: 0.2,
              rotationZ: 7,
              // ease: "back.in"
            },
            "l1"
          )
          .to(
            "img.l2",
            {
              duration: 0.2,
              delay: 0.05,
              rotationZ: 5,
              // ease: "back.in"
            },
            "l1"
          )
          .to(
            "img.l3",
            {
              duration: 0.2,
              rotationZ: -7,
              // ease: "back.in"
            },
            "l1"
          )
          .to(
            "img.l1",
            {
              duration: 0.4,
              rotationZ: 0,
              ease: "back.out",
            },
            "l2"
          )
          .to(
            "img.l2",
            {
              // delay: .05,
              duration: 0.4,
              rotationZ: 0,
              ease: "back.out",
            },
            "l2"
          )
          .to(
            "img.l3",
            {
              duration: 0.4,
              rotationZ: 0,
              ease: "back.out",
            },
            "l2"
          );
      },
      mouseleave: (e) => {
        eyeTl.reverse();
        lightTl.reverse();
        legsTl.reverse();
      },
    });

    $(".burger").on({
      click: (e) => {
        gsap.to(".burger", { duration: 0.5, rotationZ: 180 });
        menuOpenTl.timeScale(1.5).reverse();
      },
    });
  }

  setPositions(arr) {
    arr.forEach((child) => {
      const box = child.getBoundingClientRect();
      child.baseX = box.left + box.width * 0.5;
      child.baseY = box.top + box.height * 0.5;
      child.x = child.baseX;
      child.y = child.baseY;
      child.width = box.width;
      child.height = box.height;

      gsap.set(child, { scale: 0 });
      gsap.set($(child).find("h2"), { opacity: 0 });
    });
  }

  setChildLines(menuItem, children, lines) {
    children.forEach((child, idx) => {
      let x1 = menuItem.x,
        y1 = menuItem.y,
        x2 = child.x,
        y2 = child.y;

      // l(x1, y1, x2, y2)

      lines[idx].fullWidth = Math.sqrt(
        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
      );
      gsap.set(lines[idx], {
        css: {
          width: 0,
          rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        },
      });
    });
  }
}

// Generic class for attraction circle
class AttrCircle {
  constructor(options) {
    this.el = options.el;
    if (options.borderColor) {
      this.borderColor = options.borderColor;
      $(this.el).css("border-color", options.borderColor);
    }

    this.noZoom = !!options.noZoom;
    this.hover = false;
    this.calculatePosition();
    this.attachEventsListener();
  }

  attachEventsListener() {
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("resize", (e) => this.calculatePosition(e));
  }

  calculatePosition() {
    gsap.set(this.el, {
      x: 0,
      y: 0,
      scale: 1,
    });
    const box = this.el.getBoundingClientRect();
    this.baseX = box.left + box.width * 0.5;
    this.baseY = box.top + box.height * 0.5;
    this.x = this.baseX;
    this.y = this.baseY;
    this.width = box.width;
    this.height = box.height;
  }

  onMouseMove(e) {
    let box = this.el.getBoundingClientRect();
    this.y = box.top + box.height * 0.5;
    let hover = false;
    let hoverArea = this.hover ? 0.65 : 0.55;
    let x = e.clientX - this.x;
    let y = e.clientY - this.y;
    let distance = Math.sqrt(x * x + y * y);
    if (distance < this.width * hoverArea) {
      hover = true;
      if (!this.hover) {
        this.hover = true;
      }
      this.onHover(e.clientX, e.clientY);
    }

    if (!hover && this.hover) {
      this.onLeave();
      this.hover = false;
    }
  }

  onHover(x, y) {
    gsap.to(this.el, {
      duration: 0.7,
      x: (x - this.x) * 0.2,
      y: (y - this.y) * 0.2,
      scale: this.noZoom ? 1 : 1.2,
      ease: "power2.out",
    });

    if (this.borderColor) {
      gsap.to(this.el, {
        duration: 0.7,
        border: "6px solid " + this.borderColor,
        ease: "power2.out",
      });
    }
  }

  onLeave() {
    gsap.to(this.el, {
      duration: 0.7,
      x: 0,
      y: 0,
      scale: 1,
      ease: "power2.out",
    });

    if (this.borderColor) {
      gsap.to(this.el, {
        duration: 0.7,
        border: "1px solid " + this.borderColor,
        ease: "power2.out",
      });
    }
  }
}

// new AttrCircle({ el: $(".ctn-anim-outer")[0] });
new AttrCircle({ el: $(".burger")[0] });

$(() => {
  const menuTr = new MenuTransition();
  menuTr.animate();
});
