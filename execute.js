var clickDown = false
var scrolling = false
var wheelNum = 0
var topMouse = 0
var leftMouse = 0
var scrollMouseNum = 0

var sens_scroll = 5

var newTab = false
var sendBlock = true
var scrollMouse = false

var linux_content_bug = 0
var linux_content_bug_timeout = 300

function sendRequest(param) {
	chrome.extension.sendRequest(param)
}

function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    
    return html.replace(/<\/?[^>]+>/gi, '')
}

function mouseWheel(event) {
	if (clickDown === false) return true
	
    var delta = 0;
    
    this.handle = function(delta) {
    	if (delta < 0) sendRequest({ type: 'scroll', scroll: 'down' })
    	else sendRequest({ type: 'scroll', scroll: 'up' })
    	
    	wheelNum = 0
    }
    
    scrolling = true
	
    var delta = event.detail? event.detail * (-120) : event.wheelDelta
    
	wheelNum++
    if (wheelNum < sens_scroll) {
    	
    	return false
    	
    } else wheelNum = 0
	
	this.handle(delta)
	
	//console.log('clickDown ' + clickDown)
	
	if (clickDown === true) return false
	
	return true
}

function mouseUp(e) {
	//console.log('mouse up')
	
	console.log(getSelectionHtml())
	
	var returnValue = true
	var clickType = e.button
	console.log('mouse button -> ' + e.button)
	
	if (clickType == 2) {
		if (scrolling === true || newTab == true) {
			returnValue = false
		}

		wheelNum = 0
		sendRequest({ type: 'click_up' })
		
		if (linux_content_bug == 1) clearParams()
	}
	
	return returnValue
}

var clickFirst = 0
function mouseClick(e) {
	//console.log('mouse click')
	
	if (clickDown === true) {
		
		if (e.button == 0) {
			clickFirst++
			newTab = true
			
			if (clickFirst == 1) {
				setTimeout(function() {
					if (clickFirst <= 1) sendRequest({ type: 'click_right_left' })
					else sendRequest({ type: 'doubleclick_right_left' })
					
					clickFirst = 0
				}, 150)
			}
		}
		
		return false
	}
	
	return true
}

function mouseDown(e) {
	var clickType = e.button
	//e.stopPropagation()
	
	//console.log('mouse down')
	
	topMouse = e.screenY
	leftMouse = e.screenX
	
	if (clickType == 2) {
		clickDown = true
		sendRequest({ type: 'click_down' })
	}
	
	return true
}

var closeTab = false
var contextClickNum = 0
function contextMenu(e) {
	contextClickNum = contextClickNum + 1
	//console.log('linux_content_bug -> ' + contextClickNum)
	
	if (linux_content_bug == 1) {
		if (contextClickNum >= 2) {
			contextClickNum = 0
			
			clearParams()
			
			return true
		} else {
			setTimeout(function() {
				contextClickNum = 0
			}, linux_content_bug_timeout)
			
			return false
		}
	} else return clearParams()
}

function clearParams () {
	var returnValue = true
	
	if (clickDown === true && scrolling === true || scrollMouse === true) {
		returnValue = false
		
		sendRequest({ type: 'clear' })
		sendRequest({ type: 'click_up' })
	}
	
	if (newTab === true) {
		newTab = false
		
		returnValue = false
	}
	
	if (closeTab === true) {
		closeTab = false
		sendRequest({ type: 'clear', param: 'closeTab: false; clickDown = false;' })
		
		returnValue = false
	}
	
	sendBlock = true
	clickDown = false
	scrolling = false
	scrollMouse = false
	mouseMoveXY = null
	scrollMouseNum = 0
	wheelNum = 0
	
	return returnValue
}

var mouseMoveXY
function mouseMove(e) {
	if (clickDown === true && newTab === false && scrolling === false) {
		var x = leftTmp =  leftMouse - e.screenX
		var y = topTmp = topMouse - e.screenY
		
		var sendScrollRequest
		
		if (x < 0) x *= (-1)
		if (y < 0) y *= (-1)
		
		if (mouseMoveXY == null) {
			if (x > y) mouseMoveXY = 'x'
			else mouseMoveXY = 'y'
		}
		
		var scrollingNum = 0
		if (mouseMoveXY == 'x') {
			if (leftTmp > 30)
			{
				sendScrollRequest = 'left'
				leftMouse = e.screenX
			}
			else if (leftTmp < -30)
			{
				sendScrollRequest = 'right'
				leftMouse = e.screenX
			}
		}
		
		if (mouseMoveXY == 'y') {
			
			if (topTmp > 30)
			{
				sendScrollRequest = 'up'
				topMouse = e.screenY
			}
			else if (topTmp < -30)
			{
				sendScrollRequest = 'down'
				topMouse = e.screenY
			}
		}
		
		if (sendScrollRequest) {
			newTab = true
			sendRequest({ type: 'mouse_move', mouse: sendScrollRequest, top: topMouse, left: leftMouse })
		}
	}
}

document.onmousewheel = mouseWheel
document.onmouseup = mouseUp
document.onmousedown = mouseDown
document.oncontextmenu = contextMenu

//document.onmousemove = mouseMove
//document.onclick = mouseClick