import gsap from "gsap";
import { l } from "./helpers";

import "./sass/style.sass";

class Menu {
  constructor() {
    l("menu", gsap)
  }
}

const menu = new Menu();