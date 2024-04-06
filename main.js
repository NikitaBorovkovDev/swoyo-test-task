class App {
  constructor(appElement) {
    this.appElement = appElement;
  }

  draggables = [];
  containers = [];

  /**
   * @param {{tag: string, text: string, id: string, type: string, attribute: string[], placeholder: string, classes: string[], eventName: string, eventFunc: () => void}} props
   * @returns
   */
  createDomElement(props) {
    const {
      tag,
      text,
      id,
      type,
      attribute,
      placeholder,
      classes,
      eventName,
      eventFunc,
    } = props;
    const element = document.createElement(tag);

    if (text) element.textContent = text;
    if (attribute) element.setAttribute(...attribute);
    if (type) element.type = type;
    if (id) element.id = id;
    if (placeholder) element.placeholder = placeholder;
    if (classes) element.classList.add(...classes);
    if (eventName) {
      element.addEventListener(eventName, eventFunc);
    }

    return element;
  }

  createDragContainerField() {
    const div = this.createDomElement({
      tag: "div",
      classes: ["js-main-container", "main-container"],
    });

    const container = this.createDomElement({
      tag: "div",
      classes: ["container", "js-container"],
      eventName: "dragover",
      eventFunc: this.dragover,
    });

    const input = this.createDomElement({
      tag: "input",
      classes: ["js-search", "search"],
      placeholder: "search",
      type: "text",
      eventName: "input",
      eventFunc: this.handleSearchInput(container),
    });

    this.containers.push(container);
    div.appendChild(input);
    div.appendChild(container);

    this.appElement.appendChild(div);
  }

  removeDragContainerField(container) {
    const searchField = container.querySelector(".js-search");

    container.removeEventListener("dragover", this.dragover);
    if (searchField) {
      searchField.removeEventListener(
        "input",
        this.handleSearchInput(container)
      );
    }
    container.closest(".js-main-container").remove();
  }

  handleSearchInput(container) {
    return (e) => {
      const text = e.currentTarget.value;
      this.sortDraggableElement(container, text);
    };
  }

  reset() {
    this.draggables.forEach((draggable) => {
      this.removeDragElement(draggable);
    });
    this.draggables = [];
    const searchFields = document.querySelectorAll("js-search");
    searchFields.forEach((searchField) => {
      searchField.value("");
    });
    this.containers.forEach((container) => {
      this.removeDragContainerField(container);
    });
    this.containers = [];
  }

  sortDraggableElement(element, text) {
    function sortDraggableElementRecursive(currentElement) {
      if (currentElement.classList.contains("js-span")) {
        const draggableElement = currentElement.closest(".js-draggable");
        if (
          !currentElement.textContent.toLowerCase().includes(text.toLowerCase())
        ) {
          draggableElement.style.display = "none";
        } else {
          draggableElement.style.display = "";
        }
      }

      const children = currentElement.children;
      for (let i = 0; i < children.length; i++) {
        sortDraggableElementRecursive(children[i]);
      }
    }

    sortDraggableElementRecursive(element);
  }

  init() {
    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("js-delete")) {
        this.removeElement(event.target);
      }
    });

    this.createDragContainerField();
    this.createDragContainerField();

    // просто тестовые значения
    this.addDraggableElement("test 1");
    this.addDraggableElement("test 2");
    this.addDraggableElement("test 3");
    this.addDraggableElement("test 4");

    const div = this.createDomElement({
      tag: "div",
      classes: ["add-field"],
    });

    const addElementField = this.createDomElement({
      tag: "input",
      classes: ["add-field"],
      id: "new-element-input",
      placeholder: "Текст внутри элемента",
    });

    const addButton = this.createDomElement({
      tag: "button",
      text: "Добавить новый элемент",
      classes: ["add-button"],
      eventName: "click",
      eventFunc: () => {
        const inputText = document.getElementById("new-element-input")?.value;
        app.addDraggableElement(inputText);
      },
    });

    const resetButton = this.createDomElement({
      tag: "button",
      text: "Сброс",
      classes: ["reset-button"],
      eventName: "click",
      eventFunc: () => {
        this.reset();
      },
    });

    const addNewContainer = this.createDomElement({
      tag: "button",
      text: "Добавить новый блок",
      eventName: "click",
      eventFunc: () => {
        this.createDragContainerField();
      },
    });

    div.appendChild(addElementField);
    div.appendChild(addButton);
    div.appendChild(addNewContainer);
    div.appendChild(resetButton);
    document.body.appendChild(div);
  }

  addDraggableElement(text) {
    if (!this.containers[0]) {
      return;
    }

    const element = this.createDomElement({
      tag: "div",
      classes: ["draggable", "js-draggable"],
      attribute: ["draggable", "true"],
    });

    const deleteButton = this.createDomElement({
      tag: "button",
      text: "delete",
      classes: ["js-delete"],
    });

    const span = this.createDomElement({
      tag: "span",
      classes: ["js-span"],
      text,
    });

    element.appendChild(span);
    this.addDragElementEventListeners(element);
    element.appendChild(deleteButton);
    this.containers[0].appendChild(element);
    this.draggables.push(element);

    this.updateSearch(element);
  }

  /**
   * Передаётся элемент кнопки и удаляется родительский элемент с классом "js-draggable"
   * @param {HTMLElement} element
   */
  removeElement(element) {
    let parentElement = element.parentNode;
    while (parentElement) {
      if (parentElement.classList.contains("js-draggable")) {
        this.removeDragElement(parentElement);
        break;
      }
      parentElement = parentElement.parentNode;
    }
  }

  updateSearch(dragContainer) {
    const mainContainer = dragContainer.closest(".js-main-container");
    const searchField = mainContainer.querySelector(".js-search");
    this.sortDraggableElement(
      mainContainer.querySelector(".js-container"),
      searchField.value
    );
  }

  dragstart = (event) => {
    event.currentTarget.classList.add("dragging");
  };

  dragend = (event) => {
    const dragContainer = event.currentTarget;
    dragContainer.classList.remove("dragging");

    this.updateSearch(dragContainer);
  };

  dragover = (event) => {
    event.preventDefault();
    const container = event.currentTarget;
    const mouseYPosition = event.clientY;
    const afterElement = this.getDragAfterElement(container, mouseYPosition);
    const draggable = document.querySelector(".dragging");
    if (afterElement) {
      container.insertBefore(draggable, afterElement);
    } else {
      container.appendChild(draggable);
    }
  };

  addDragElementEventListeners(draggable) {
    draggable.addEventListener("dragstart", this.dragstart);
    draggable.addEventListener("dragend", this.dragend);
  }

  removeDragElement(draggable) {
    draggable.removeEventListener("dragstart", this.dragstart);
    draggable.removeEventListener("dragend", this.dragend);
    draggable.remove();
  }

  /**
   * @param {HTMLElement} container - контейнер над которым сработал dragover
   * @param {number} mouseYPosition
   * @returns {HTMLElement | undefined} первый элемент под курсором в момент перетаскивания
   */
  getDragAfterElement(container, mouseYPosition) {
    const draggableElements = [
      ...container.querySelectorAll(".draggable:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closestAfterDragElement, draggableElement) => {
        const box = draggableElement.getBoundingClientRect();
        const offset = mouseYPosition - box.top - box.height / 2;
        if (offset < 0 && offset > closestAfterDragElement.offset) {
          return { offset: offset, element: draggableElement };
        } else {
          return closestAfterDragElement;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  getState(index) {
    const children = document.querySelectorAll(".container")[index];
    console.log(children);
  }
}

const app = new App(document.querySelector("#App"));

app.init();
