import gsap from "gsap";

export default class HoverButton {
  constructor(el, ctn, menuItems) {
    this.el = el;
    this.container = ctn;
    this.menuItems = menuItems;
    this.hover = false;
    this.mouseOnParent = false;
    this.mouseOnChild = false;
    this.imageEl = $(this.el).find(".menu-item-image");
    this.titleEl = $(this.el).find(".menu-item-name");
    this.children = $(this.el).find(".menu-item-child");
    this.childLines = $(this.el).find(".menu-item-child-line");
    this.childTitles = $(this.el).find(".menu-item-child h2");
    this.childTl = gsap.timeline();
    this.calculatePosition();
    this.attachEvents();
  }

  attachEvents() {
    const { container } = this;
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
    const { container } = this;
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
    const { menuItems } = this;
    currIdx = menuItems.index(this.el);
    let idx = currIdx,
      newX = (x - this.x) * 0.4,
      newY = (y - this.y) * 0.4;

    gsap.to($(".menu-item-desc").eq(idx), {
      duration: 0.7,
      x: (x - this.x) * 0.4,
      y: (y - this.y) * 0.4,
      scale: 1.1,
      ease: "Power2.easeOut",
    });

    gsap.to($(".menu-item-image").eq(idx), {
      duration: 0.7,
      border: "6px solid #0597ab",
      opacity: 1,
      ease: "Power2.easeOut",
    });

    gsap.to($(".menu-item-name").eq(idx), {
      duration: 0.7,
      delay: 0.1,
      x: (x - this.x) * 0.4,
      y: (y - this.y) * 0.4,
      ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
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
      ease: "Power2.easeOut",
    });

    gsap.to($(".menu-item-image"), {
      duration: 0.7,
      border: "0px solid #0597ab",
      opacity: 0.7,
      ease: "Power2.easeOut",
    });

    gsap.to($(".menu-item-name"), {
      duration: 0.7,
      delay: 0.1,
      x: 0,
      y: 0,
      ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
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
        ease: "Power2.easeOut",
      });

      (x1 = menuArr[idx - 1].x),
        (y1 = menuArr[idx - 1].y),
        (x2 = menuArr[idx].x),
        (y2 = menuArr[idx].y);

      gsap.to(prevLine, {
        duration: 0.7,
        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        rotationZ: Math.atan2(y2 - y1, x2 - x1) + "rad",
        ease: "Power2.easeOut",
      });
    }
  }

  onMouseEnter() {
    // l("onMouseEnter")
    this.mouseOnParent = true;
    if (this.children.length && this.childTl && this.childTl.progress() === 0) {
      this.childTl = gsap.timeline();
      this.childTl
        .staggerFromTo(
          this.childLines,
          0.2,
          {
            width: 0,
          },
          {
            cycle: {
              width: function (i, target) {
                return target.fullWidth;
              },
              ease: ["Power2.easeOut"],
            },
          },
          0.05
        )
        .staggerFromTo(
          this.children,
          0.2,
          {
            scale: 0,
          },
          {
            scale: 1,
            ease: "Power2.easeOut",
          },
          0.05
        )
        .staggerFromTo(
          this.childTitles,
          0.2,
          {
            x: -25,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            ease: "Power2.easeOut",
          },
          0.05
        );
    }
  }

  onMouseLeave() {
    // l("onMouseLeave")
    this.mouseOnParent = false;
    tlTimeout = setTimeout(() => {
      if (!this.mouseOnChild && !this.mouseOnParent) {
        this.childTl.reverse().timeScale(1.5);
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
            this.childTl.reverse().timeScale(1.5);
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
