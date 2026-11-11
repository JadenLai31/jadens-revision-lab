/* Humanities navigation is separate from the Science practice state. */
window.renderHumanities = function renderHumanities(root, page, navigate) {
  const views = {
    "humanities-years": {
      breadcrumb: "Humanities",
      title: "Choose a year level",
      back: ["All subjects", "home"],
      item: ["Year 8", "Explore your cycles →", "humanities-cycles", "📚"],
    },
    "humanities-cycles": {
      breadcrumb: "Humanities / Year 8",
      title: "Choose a cycle",
      back: ["Year levels", "humanities-years"],
      item: ["Cycle 6", "Shogunate Japan →", "humanities-topics", "🗂️"],
    },
    "humanities-topics": {
      breadcrumb: "Humanities / Year 8 / Cycle 6",
      title: "Choose a topic",
      back: ["Cycles", "humanities-cycles"],
      item: [
        "Shogunate Japan",
        "Open topic →",
        "humanities-shogunate-japan",
        "🏯",
      ],
    },
    "humanities-shogunate-japan": {
      breadcrumb: "Humanities / Year 8 / Cycle 6",
      title: "Shogunate Japan",
      back: ["Topics", "humanities-topics"],
    },
  };
  const view = views[page];
  if (!view) return navigate("humanities-years");
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  root.replaceChildren();
  const hero = node("section", null, "hero");
  const back = node("button", `← ${view.back[0]}`, "back");
  back.type = "button";
  back.addEventListener("click", () => navigate(view.back[1]));
  const heading = node("h1", view.title);
  heading.tabIndex = -1;
  hero.append(back, node("div", view.breadcrumb, "eyebrow"), heading);
  root.append(hero);
  if (view.item) {
    const [title, description, target, icon] = view.item;
    const grid = node("div", null, "cards-grid");
    const tile = node("button", null, "tile");
    tile.type = "button";
    const emoji = node("span", icon, "emoji");
    emoji.setAttribute("aria-hidden", "true");
    tile.append(emoji, node("strong", title), node("small", description));
    tile.addEventListener("click", () => navigate(target));
    grid.append(tile);
    root.append(grid);
  } else {
    const resources = node("div");
    resources.setAttribute("data-shogunate-root", "");
    root.append(resources);
    if (window.mountShogunate) window.mountShogunate(resources);
    else resources.append(node("p", "Loading Shogunate Japan resources…"));
  }
  heading.focus({ preventScroll: true });
};
