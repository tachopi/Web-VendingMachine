class MixMode {
    constructor(vendingSystem) {
        this.vendingSystem = vendingSystem;
        this.selectedDrinkIds = new Set();
        this.selectedDrinks = [];
        this.selectedRates = [];
        this.drinkRateMap = {};
        this.emptySlots = [1, 2, 3];
        this.drinkColors = {
            1: '#000000',
            2: '#190707',
            3: '#D8D8D8',
            4: '#D8D8D8',
            5: '#F2F2F2',
            6: '#FF8000',
            7: '#F3E2A9',
            8: '#D8D8D8',
            9: '#B18904',
            10: '#61210B',
            11: '#E6E6E6',
            12: '#A9F5A9',
            13: '#F5F6CE',
            14: '#3B0B0B',
            15: '#088A08'
        };
        this.handleBodyClick = this.handleBodyClick.bind(this);
    }
    initEventListeners() {
        document.body.removeEventListener('click', this.handleBodyClick);
        document.body.addEventListener('click', this.handleBodyClick);
    }
    handleBodyClick(event) {
        if (event.target.matches('.buybutton')) {
            this.handleDrinkButtonClick(event);
        } else if (event.target.matches('.cupReset')) {
            this.resetRateSelection();
        } else if (event.target.matches('.rate80, .rate60, .rate40, .rate20, .rate0')) {
            this.handleRateButtonClick(event);
        } else if (event.target.matches('.cupFinish')) {
            this.handleConfirmButtonClick();
        } else if (event.target.matches('[id^="drinkimg"]')) {
            const index = event.target.id.replace('drinkimg', '');
            this.handleDrinkImgClick(parseInt(index, 10));
        }
    }
    updateCalcmix() {
        let totalPrice = 0;
        this.selectedDrinks.forEach((drink, index) => {
            const drinkId = drink.dataset.id;
            const rate = this.selectedRates[index] || 0; 
            const price = parseInt(document.querySelector(`.buybutton[data-id="${drinkId}"]`).getAttribute('data-price'), 10);
            totalPrice += (price * rate) / 100;
        });
        const roundedTotalPrice = Math.round(totalPrice);
        this.displayCalcmix(roundedTotalPrice);
    }
    displayCalcmix(totalPrice) {
        const calcmix = document.querySelector('.calc');
        if (calcmix) {
            const mixprice = calcmix.querySelector('[data-mixprice]');
            if (mixprice) {
                mixprice.textContent = `필요금액: ${totalPrice}원`;
            }
        }
    }
    clearCalcmix() {
        const calcmix = document.querySelector('.calc');
        if (calcmix) {
            const mixprice = calcmix.querySelector('[data-mixprice]');
            if (mixprice) {
                mixprice.textContent = '';
            }
        }
    }
    handleConfirmButtonClick() {
        if (!this.vendingSystem.isLocked) {
            alert("혼합 모드가 활성화되지 않았습니다.");
            return;
        }
        if (this.selectedRates.length !== 3) {
            alert("세 개의 음료와 각각의 비율을 선택해야 합니다.");
            return;
        }
        const totalRate = this.selectedRates.reduce((acc, val) => acc + val, 0);
        if (totalRate !== 100) {
            alert("선택한 비율의 합이 100%가 되어야 합니다.");
            return;
        }
        let totalPrice = 0;
        this.selectedDrinks.forEach((drink, index) => {
            const drinkId = drink.dataset.id;
            const rate = this.selectedRates[index];
            const price = parseInt(document.querySelector(`.buybutton[data-id="${drinkId}"]`).getAttribute('data-price'), 10);
            totalPrice += (price * rate) / 100;
        });
        const roundedTotalPrice = Math.round(totalPrice);
        if (roundedTotalPrice > this.vendingSystem.totalAmount) {
            alert("잔액이 부족하여 구매할 수 없습니다.");
            return;
        }
        this.vendingSystem.totalAmount -= roundedTotalPrice;
        this.vendingSystem.updateTotalAmountDisplay();
        alert(`총 결제 금액은 ${roundedTotalPrice}원입니다. 구매가 완료되었습니다.`);
        this.showMixedDrinkInDispenser();
        this.vendingSystem.isLocked = false;
        document.querySelector('.mix-mode').style.display = 'none';
        this.resetSelectedAll();
        this.vendingSystem.updateBuyButtonImage();
        this.clearCalcmix();
        this.resetRateSelection();
    }
    showMixedDrinkInDispenser() {
        const dispenser = document.querySelector('.dispenser');
        const cup = document.createElement('div');
        cup.className = 'drink';
        cup.style.width = '80px';
        cup.style.height = '160px';
        cup.style.position = 'absolute';
        cup.style.bottom = '-20px';
        cup.style.left = '50%';
        cup.style.borderRadius = '0 0 15px 15px';
        cup.style.transform = "rotate(90deg) translateY(50%)";
        cup.style.transform = "translateX(-50%) rotate(90deg)";
        const mixedColor = this.calculateMixedColor();
        const cupContent = document.createElement('div');
        cupContent.className = 'cup-content';
        cupContent.style.height = '100%';
        cupContent.style.width = '100%';
        cupContent.style.backgroundColor = mixedColor;
        cupContent.style.borderRadius = '0 0 15px 15px';
        cup.appendChild(cupContent);
        dispenser.appendChild(cup);
        cup.addEventListener('click', () => {
            dispenser.removeChild(cup);
            alert('혼합 음료가 제공되었습니다!');
        });
        this.clearDrink();
    }
    calculateMixedColor() {
        const rgbColors = this.selectedDrinks.map((drink, index) => {
            const color = this.drinkColors[drink.dataset.id];
            const rate = this.selectedRates[index] / 100;
            const rgb = this.hexToRgb(color);
            return { r: rgb.r * rate, g: rgb.g * rate, b: rgb.b * rate };
        });
        const mixedColor = rgbColors.reduce(
            (acc, curr) => {
                acc.r += curr.r;
                acc.g += curr.g;
                acc.b += curr.b;
                return acc;
            },
            { r: 0, g: 0, b: 0 }
        );
        return this.rgbToHex(
            Math.round(mixedColor.r),
            Math.round(mixedColor.g),
            Math.round(mixedColor.b)
        );
    }
    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    }
    rgbToHex(r, g, b) {
        return (
            '#' +
            [r, g, b]
                .map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                })
                .join('')
        );
    }
    clearDrink() {
        const drinkImgSlots = document.querySelectorAll('[id^="drinkimg"]');
        drinkImgSlots.forEach(slot => {
            slot.src = '';
            slot.style.visibility = 'hidden';
            slot.removeAttribute('data-id'); 
            slot.removeAttribute('data-slot');
        });
        const cup = document.querySelector('.cup');
        if (cup) cup.innerHTML = '';
    }
    handleDrinkButtonClick(event) {
        if (!this.vendingSystem.isLocked) {
            return;
        }
        const button = event.target;
        const drinkId = button.getAttribute('data-id');
        if (!this.selectedDrinkIds.has(drinkId)) {
            const drinkImg = document.querySelector(`.drink[data-id="${drinkId}"]`);
            if (drinkImg) {
                const emptySlot = this.emptySlots.shift();
                if (emptySlot === undefined) {
                    alert("전부 선택하셨습니다.");
                    return;
                }
                const drinkImgClone = drinkImg.cloneNode(true);
                this.selectedDrinks.push(drinkImgClone);
                this.selectedDrinkIds.add(drinkId);
                const drinkImgSlot = document.getElementById(`drinkimg${emptySlot}`);
                if (drinkImgSlot) {
                    drinkImgSlot.src = drinkImgClone.src;
                    drinkImgSlot.style.visibility = 'visible';
                    drinkImgSlot.dataset.id = drinkId;
                    drinkImgSlot.dataset.slot = emptySlot;
                }
                button.src = "img/비활성화버튼.png";
                button.alt = "비활성화";
                button.disabled = true;
            }
        } 
    }
    handleDrinkImgClick(index) {
        if (!this.vendingSystem.isLocked) {
            return;
        }
        const drinkImgSlot = document.getElementById(`drinkimg${index}`);
        if (drinkImgSlot && drinkImgSlot.dataset.id) {
            const drinkId = drinkImgSlot.dataset.id;
            if (this.drinkRateMap[drinkId]) {
                alert("음료의 비율이 선택된 상태에서는 음료를 취소할 수 없습니다.");
                return;
            }
            this.selectedDrinkIds.delete(drinkId);
            this.selectedDrinks = this.selectedDrinks.filter(drink => drink.dataset.id !== drinkId);
            const button = document.querySelector(`.buybutton[data-id="${drinkId}"]`);
            if (button) {
                button.src = "img/활성화버튼.png";
                button.alt = "활성화";
                button.disabled = false;
            }
            drinkImgSlot.src = '';
            drinkImgSlot.style.visibility = 'hidden';
            drinkImgSlot.dataset.id = '';
            this.emptySlots.push(index);
            this.emptySlots.sort();
        }
    }
    handleRateButtonClick(event) {
        if (!this.vendingSystem.isLocked) {
            return;
        }
        const button = event.target;
        const rate = parseInt(button.textContent.replace('%', ''), 10);
        const choiceDiv = button.parentElement;
        const choiceIndex = parseInt(choiceDiv.dataset.choice, 10) - 1;
        if (!this.selectedDrinks[choiceIndex]) {
            alert("먼저 음료를 선택해주세요.");
            return;
        }
        const drinkId = this.selectedDrinks[choiceIndex].dataset.id;
        if (this.drinkRateMap[drinkId]) {
            alert("이미 선택된 음료의 비율입니다.");
            return;
        }
        const currentTotalRate = this.selectedRates.reduce((acc, val) => acc + val, 0);
        if (currentTotalRate + rate > 100) {
            alert("총 비율이 100%를 초과할 수 없습니다.");
            this.resetRateSelection();
            return;
        }
        this.selectedRates[choiceIndex] = rate;
        choiceDiv.dataset.selected = "true";
        this.drinkRateMap[drinkId] = rate;
        if (this.selectedRates.filter(rate => rate !== undefined).length === 3) {
            const totalRate = this.selectedRates.reduce((acc, val) => acc + val, 0);
            if (totalRate !== 100) {
                alert("선택한 음료의 비율의 합이 100%가 되어야 합니다.");
                this.resetRateSelection();
                return;
            }
        }
        this.updateCupContent();
        this.updateCalcmix();
    }
    updateCupContent() {
        const cup = document.querySelector('.cup');
        cup.innerHTML = '';
        let accumulatedHeight = 0;
        let firstSelectedRateIndex = this.selectedRates.findIndex(rate => rate !== undefined);
        this.selectedRates.forEach((rate, index) => {
            if (rate !== undefined) {
                const drinkId = this.selectedDrinks[index].dataset.id;
                const cupContent = document.createElement('div');
                cupContent.className = 'cup-content';
                cupContent.style.height = `${rate}%`;
                cupContent.style.backgroundColor = this.drinkColors[drinkId];
                cupContent.style.position = 'absolute';
                cupContent.style.bottom = `${accumulatedHeight}%`;
                if (index === firstSelectedRateIndex) {
                    cupContent.style.borderRadius = '0 0 15px 15px';
                } else {
                    cupContent.style.borderRadius = '0';
                }
                accumulatedHeight += rate;
                cup.appendChild(cupContent);
            }
        });
    }
    resetSelectedAll() {
        this.selectedRates = [];
        this.drinkRateMap = {};
        const cup = document.querySelector('.cup');
        cup.innerHTML = '';
        const choiceDivs = document.querySelectorAll('.choice1, .choice2, .choice3');
        choiceDivs.forEach(choice => {
            choice.dataset.selected = "false";
            const buttons = choice.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = false;
            });
        });
        this.selectedDrinkIds.clear();
        this.selectedDrinks = [];
        this.emptySlots = [1, 2, 3];
        this.clearCalcmix();
        this.clearDrink();
        this.resetRateSelection()
    }
    resetRateSelection() {
        const choiceDivs = document.querySelectorAll('.choice1, .choice2, .choice3');
        choiceDivs.forEach(choice => {
            choice.dataset.selected = "false";
            const buttons = choice.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = false;
            });
        });
        this.selectedRates = [];
        this.drinkRateMap = {};
        this.updateCupContent();
        this.clearCalcmix();
    }
    enableDrinkButtons() {
        const drinkButtons = document.querySelectorAll('.buybutton');
        drinkButtons.forEach(button => {
            button.src = "img/활성화버튼.png";
            button.alt = "활성화";
            button.disabled = false;
            button.onclick = this.handleDrinkButtonClick.bind(this);
        });
    }
    disableDrinkButtons() {
        const drinkButtons = document.querySelectorAll('.buybutton');
        drinkButtons.forEach(button => {
            button.src = "img/비활성화버튼.png";
            button.alt = "비활성화";
            button.disabled = true;
            button.onclick = null;
        });
    }
}
class VendingSystem {
    constructor() {
        this.totalAmount = 0;
        this.cardAmount = '';
        this.keypadVisible = false;
        this.isLocked = false;
        this.mixMode = new MixMode(this);
        document.addEventListener('DOMContentLoaded', this.initEventListeners.bind(this));
    }
    toggleLock() {
        this.isLocked = !this.isLocked;
        const mixModeContainer = document.querySelector('.mix-mode');
        if (this.isLocked) {
            alert("혼합할 음료를 선택하세요.");
            mixModeContainer.style.display = 'block';
            this.mixMode.resetSelectedAll();
            this.mixMode.initEventListeners();
            this.mixMode.enableDrinkButtons();
        } else {
            alert("혼합을 취소합니다.");
            mixModeContainer.style.display = 'none';
            this.mixMode.resetSelectedAll();
            this.mixMode.resetRateSelection();
            this.mixMode.disableDrinkButtons();
            this.mixMode.clearDrink();
        }
        this.updateBuyButtonImage();
    }
    initEventListeners() {
        const coinReader = document.querySelector('.coin-reader');
        const cashReader = document.querySelector('.cash-reader');
        const cardReader = document.querySelector('.card-reader');
        this.totalpriceElement = document.querySelector('[data-totalprice]');
        this.cardpriceElement = document.querySelector('[data-cardprice]');
        this.keypad = document.querySelector('.keypad');
        const draggableItems = document.querySelectorAll('.draggable');
        draggableItems.forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
        });
        cashReader.addEventListener('dragover', (e) => {
            e.preventDefault();
            cashReader.classList.add('hover');
        });
        cashReader.addEventListener('dragleave', () => {
            cashReader.classList.remove('hover');
        });
        cashReader.addEventListener('drop', (e) => {
            e.preventDefault();
            cashReader.classList.remove('hover');
            this.handleDrop('cash-reader', e);
        });
        cardReader.addEventListener('dragover', (e) => {
            e.preventDefault();
            cardReader.classList.add('hover');
        });
        cardReader.addEventListener('dragleave', () => {
            cardReader.classList.remove('hover');
        });
        cardReader.addEventListener('drop', (e) => {
            e.preventDefault();
            cardReader.classList.remove('hover');
            this.handleDrop('card-reader', e);
        });
        coinReader.addEventListener('dragover', (e) => {
            e.preventDefault();
            coinReader.classList.add('hover');
        });
        coinReader.addEventListener('dragleave', () => {
            coinReader.classList.remove('hover');
        });
        coinReader.addEventListener('drop', (e) => {
            e.preventDefault();
            coinReader.classList.remove('hover');
            this.handleDrop('coin-reader', e);
        });
        const inputButtons = document.querySelectorAll('.Pbutton');
        inputButtons.forEach(button => {
            button.addEventListener('click', this.handleInputButtonClick.bind(this));
        });
        const refundButton = document.querySelector('.refund-button');
        refundButton.addEventListener('click', () => {
            refundButton.src = 'img/refundbuttonafter.png';
            setTimeout(() => {
                refundButton.src = 'img/refundbutton.png';
            }, 300);
            if (this.totalAmount == 0) {
                return;
            } else {
                let refundAmount = this.totalAmount;
                this.totalAmount = 0;
                this.updateTotalAmountDisplay();
                this.updateBuyButtonImage();
                const refundCover = document.querySelector('.refund');
                let refundMoney = document.createElement('img');
                refundMoney.src = 'img/refundmoney.png';
                refundMoney.className = 'refund-money';
                refundCover.appendChild(refundMoney);
                refundMoney.addEventListener('click', function () {
                    refundCover.removeChild(this);
                    alert(`${refundAmount}원이 반환되었습니다.`);
                });
            }
        });
        const mixButton = document.querySelector('.mix-mode-button');
        mixButton.addEventListener('click', this.toggleLock.bind(this));
    }
    handleDragStart(e) {
        e.dataTransfer.setData('amount', e.target.getAttribute('data-amount'));
        e.dataTransfer.setData('type', e.target.getAttribute('data-type'));
    }
    handleDrop(readerType, e) {
        e.preventDefault();
        let amount = parseInt(e.dataTransfer.getData('amount'), 10);
        let type = e.dataTransfer.getData('type');
        switch (readerType) {
            case 'coin-reader':
                if (type === 'coin' && [100, 500].includes(amount)) {
                    this.incrementTotalAmount(amount);
                } else {
                    alert("잘못 넣으셨습니다.");
                }
                break;
            case 'cash-reader':
                if (type === 'cash' && [1000, 5000, 10000, 50000].includes(amount)) {
                    this.incrementTotalAmount(amount);
                } else {
                    alert("잘못 넣으셨습니다.");
                }
                break;
            case 'card-reader':
                if (type === 'card') {
                    this.showKeypad();
                } else {
                    alert("잘못 넣으셨습니다.");
                }
                break;
            default:
                alert("잘못된 리더기입니다.");
        }
    }
    showKeypad() {
        this.cardAmount = '';
        this.keypadVisible = true;
        this.updateCardAmountDisplay();
    }
    hideKeypad() {
        this.keypadVisible = false;
        this.updateCardAmountDisplay();
    }
    handleInputButtonClick(e) {
        if (!this.keypadVisible) {
            return;
        }
        const value = e.target.getAttribute('data-value');
        if (value === 'cancel') {
            if (this.cardAmount.length === 0) {
                this.hideKeypad();
            } else {
                this.cardAmount = this.cardAmount.slice(0, -1);
            }
        } else if (value === 'confirm') {
            const amount = parseInt(this.cardAmount, 10);
            if (!isNaN(amount) && amount > 0) {
                this.incrementTotalAmount(amount);
                this.cardAmount = '';
                this.hideKeypad();
            } else {
                alert("올바른 금액을 입력해주세요.");
            }
        } else {
            this.cardAmount += e.target.getAttribute('data-number');
        }
        this.updateCardAmountDisplay();
    }
    incrementTotalAmount(amount) {
        this.totalAmount += amount;
        this.updateTotalAmountDisplay();
        if (!this.isLocked) {
            this.updateBuyButtonImage();
        }
    }
    updateTotalAmountDisplay() {
        const totalpriceElement = document.querySelector('[data-totalprice]');
        if (totalpriceElement) {
            totalpriceElement.textContent = `투입금액: ${this.totalAmount}원`;
        }
    }
    updateCardAmountDisplay() {
        const cardpriceElement = document.querySelector('[data-cardprice]');
        if (this.keypadVisible && cardpriceElement) {
            cardpriceElement.textContent = `입력 중: ${this.cardAmount}원`;
        } else if (cardpriceElement) {
            cardpriceElement.textContent = '';
        }
    }
    updateBuyButtonImage() {
        const buyButtons = document.querySelectorAll('.buybutton');
        buyButtons.forEach((button) => {
            const price = parseInt(button.getAttribute('data-price'), 10);
            const drinkId = button.getAttribute('data-id');
            if (!this.isLocked && this.totalAmount >= price) {
                button.src = "img/활성화버튼.png";
                button.alt = "활성화";
                button.disabled = false;
                button.onclick = () => {
                    if (this.totalAmount >= price) {
                        this.totalAmount -= price;
                        this.updateTotalAmountDisplay();
                        this.updateBuyButtonImage();
                        const drink = document.querySelector(`.drink[data-id="${drinkId}"]`);
                        const dispenser = document.querySelector('.dispenser');
                        if (drink && dispenser) {
                            const drinkClone = drink.cloneNode(true);
                            dispenser.appendChild(drinkClone);
                            drinkClone.classList.add('drink');
                            drinkClone.style.position = "absolute";
                            drinkClone.style.bottom = "0";
                            drinkClone.style.left = "50%";
                            drinkClone.style.transform = "rotate(90deg) translateY(50%)";
                            drinkClone.style.transform = "translateX(-50%) rotate(90deg)";
                            drinkClone.addEventListener('click', () => {
                                dispenser.removeChild(drinkClone);
                                alert('음료가 제공되었습니다!');
                            });
                        }
                    }
                };
            } else if (this.isLocked) {
                button.src = "img/활성화버튼.png";
                button.alt = "활성화";
                button.disabled = false;
                button.onclick = this.mixMode.handleDrinkButtonClick.bind(this.mixMode);
            } else {
                button.src = "img/비활성화버튼.png";
                button.alt = "비활성화";
                button.disabled = true;
                button.onclick = null;
            }
        });
    }
}
new VendingSystem();