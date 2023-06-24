/* eslint-disable no-redeclare*/
/* eslint-disable no-undef*/
var imageUpload = document.getElementById('imageUpload');
var inputCanvas = document.getElementById('inputCanvas');
var inputContext = inputCanvas.getContext('2d', { willReadFrequently: true });
var outputCanvas = document.getElementById('outputCanvas');
var outputContext = outputCanvas.getContext('2d', { willReadFrequently: true });
var inputCanvasColorblind = document.getElementById('inputCanvasColorblind');
var inputContextColorblind = inputCanvasColorblind.getContext('2d');
var outputCanvasColorblind = document.getElementById('outputCanvasColorblind');
var outputContextColorblind = outputCanvasColorblind.getContext('2d');
var configElement = {
    severity: document.getElementById('severity'),
    vision: document.getElementById('vision'),
    debug: document.getElementById('debug'),
    m: document.getElementById('m'),
    b: document.getElementById('b'),
    kmeansClusterNum: document.getElementById('kmeansClusterNum'),
    confirm: document.getElementById('confirm')
}
var loadedImageData = null;
var outputImageData = null;

const config = {
    severity: 100,
    kmeansClusterNum: 16,
    debug: false,
    m: Math.PI * 0.07, // maximum movement distance of the remap function
    b: 0.3,
    vision: 'protanopia',
    confusionLines: {
        protanopia: {
            u: 0.678,
            v: 0.501
        },
        deuteranopia: {
            u: -1.217,
            v: 0.782
        },
        tritanopia: {
            u: 0.257,
            v: 0.0
        }
    },
    angleBoundaries: {
        protanopia: {
            thetaPrimeV: -1.4988,
            thetaPrime0: -2.1698,
            thetaPrimeKadd1: -1.4600
        },
        deuteranopia: {
            thetaPrimeV: 1.6428,
            thetaPrime0: 1.7329,
            thetaPrimeKadd1: 1.9922
        },
        tritanopia: {
            thetaPrimeV: undefined,
            thetaPrime0: -0.4749,
            thetaPrimeKadd1: -0.3548
        }
    },
    preprocessAngleBoundaries: {
        protanopia: {
            lowTheta: Math.PI / 4 * 3,
            highTheta: Math.PI / 2 * 3
        },
        deuteranopia: {
            lowTheta: Math.PI / 2 * 3,
            highTheta: Math.PI * 2
        },
        tritanopia: {
            lowTheta: 0,
            highTheta: Math.PI / 4 * 3
        }
    }
}

function refreshConfig() {
    configElement.severity.value = config.severity
    configElement.vision.value = config.vision
    configElement.debug.checked = config.debug
    configElement.m.value = config.m / Math.PI
    configElement.b.value = config.b
    configElement.kmeansClusterNum.value = config.kmeansClusterNum
    if (config.debug)
        log("<font color='orange'>Debug on!</font>")
}

refreshConfig()
configElement.severity.addEventListener('change', e => {
    config.severity = e.target.value; refreshConfig();
    refreshColorblindness()
})
configElement.vision.addEventListener('change', e => {
    config.vision = e.target.value; refreshConfig();
    refreshColorblindness()
})
configElement.debug.addEventListener('change', e => { config.debug = e.target.checked; refreshConfig() })
configElement.m.addEventListener('change', e => { config.m = e.target.value * Math.PI; refreshConfig() })
configElement.b.addEventListener('change', e => { config.b = e.target.value; refreshConfig() })
configElement.kmeansClusterNum.addEventListener('change', e => { config.kmeansClusterNum = e.target.value; refreshConfig() })

configElement.confirm.addEventListener('click', e => {
    if (!loadedImageData) {
        log("<font color='pink'>Error: No image loaded!</font>")
        return
    }
    daltonization(loadedImageData)
    loadedImageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    outputImageData = outputContext.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
})

function applyMatrix(rgb) { return getMachadoMatrix(config.vision, parseInt(config.severity, 10))(rgb); }
function simulateColorblindness(imageData) {
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var rgb = [data[i], data[i + 1], data[i + 2]];
        var matrix = applyMatrix(rgb);
        data[i] = matrix[0];
        data[i + 1] = matrix[1];
        data[i + 2] = matrix[2];
    }
    return data;
}
function refreshColorblindness() {
    if (loadedImageData) {
        const colorblindImageData = new ImageData(simulateColorblindness(loadedImageData), loadedImageData.width, loadedImageData.height)
        inputContextColorblind.putImageData(colorblindImageData, 0, 0)
    }
    if (outputImageData) {
        const colorblindImageData = new ImageData(simulateColorblindness(outputImageData), outputImageData.width, outputImageData.height)
        outputContextColorblind.putImageData(colorblindImageData, 0, 0)
    }
    loadedImageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    outputImageData = outputContext.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
}

function log(entry) {
    var pLog = document.createElement("p")
    pLog.innerHTML = entry
    document.getElementById("log").appendChild(pLog)
}

imageUpload.addEventListener('change', function(event) {
	var file = event.target.files[0];
	var reader = new FileReader();
    if (config.debug)
        log("Loading new image...")

	reader.onload = function(e) {
		var image = new Image();

		image.onload = function () {
			log("Image loaded: <font color='yellow'>"+image.width+"x"+image.height+"</font>")
			inputCanvas.width = image.width;
            inputCanvas.height = image.height;
            outputCanvas.width = image.width;
            outputCanvas.height = image.height;
            inputCanvasColorblind.width = image.width;
            inputCanvasColorblind.height = image.height;
            outputCanvasColorblind.width = image.width;
            outputCanvasColorblind.height = image.height;
            inputContext.drawImage(image, 0, 0);
            loadedImageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
            refreshColorblindness()
		};

		image.src = e.target.result;
	};

	reader.readAsDataURL(file);
});

function daltonization(imageData) {
    try {
        configElement.confirm.disabled = true
        var [centers, clusters, rInformation] = performColorClustering(imageData)
        var centersRemapped = colorCenterRemapping(centers)
        outputImage(imageData, clusters, centersRemapped, rInformation)
        configElement.confirm.disabled = false
    } catch (e) {
        log("<font color='pink'>Error: " + e + "</font>")
        throw(e)
    }
}

// Step 1: Transform RGB to Lu'v' color space and perform color clustering

function rgbToLuv(r, g, b) {
    var luv = Color.xyzToLuv(Color.rgbToXyz([r, g, b]))
	return luv;
}
function luvToRgb(l, u, v) {
    var luv = Color.xyzToRgb(Color.luvToXyz([l, u, v]))
	return luv;
}


// Function to perform color clustering
function performColorClustering(imageData) {
    const luvPixels = [];
    const data = imageData.data
    const output = new Uint8ClampedArray(data.length)
 
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
    
        const [L, u, v] = rgbToLuv(r, g, b);
        output[i] = L
        output[i + 1] = u
        output[i + 2] = v
        output[i + 3] = 255
        luvPixels.push([u,v]); // we're only interested in u and v
    }

    const kmeans = new kMeans({ K: config.kmeansClusterNum }); // clustering into 8 colors, adjust as necessary
    kmeans.cluster(luvPixels)
    while (kmeans.step()) {
        kmeans.findClosestCentroids();
        kmeans.moveCentroids();
        if(kmeans.hasConverged()) break;
    }
    
    const centers = kmeans.centroids
    const clusters = kmeans.clusters
    const rInformation = {}
    clusters.forEach((cluster, index) => {
        rInformation[index] = { Ravg: 0, count: 0, Rmax: -Infinity, Rmin: Infinity }
        cluster.forEach((e) => {
            i = e * 4
            const [L, u, v] = [output[i], output[i + 1], output[i + 2]]
            const u_con = config.confusionLines[config.vision].u
            const v_con = config.confusionLines[config.vision].v
            const R = Math.sqrt((u - u_con) ** 2 + (v - v_con) ** 2)
            rInformation[index].Ravg = (rInformation[index].Ravg * rInformation[index].count + R) / (rInformation[index].count + 1)
            rInformation[index].count += 1
            rInformation[index].Rmax = Math.max(rInformation[index].Rmax, R)
            rInformation[index].Rmin = Math.min(rInformation[index].Rmin, R)
            if (rInformation[index].Rmax > 100) console.log(R, Ravg, count)
            if (rInformation[index].Rmin < 0) console.log(R, Ravg, count)
        })
    })
    log(`Cluster numbers: <font color='yellow'>${config.kmeansClusterNum}</font>`)
    return [centers, clusters, rInformation];
}


// Step 2: Color center remapping
/*
function checkAngleBoundaries(theta) { return theta > config.preprocessAngleBoundaries[config.vision].lowTheta && theta < config.preprocessAngleBoundaries[config.vision].highTheta }
function angleFix(thetaUnfixed, triangularFunction) {
    let theta = thetaUnfixed
    if (theta < 0) theta += 2 * Math.PI
    if (checkAngleBoundaries(theta)) return [theta, true]
    if (triangularFunction == 'sin')
        if (theta < Math.PI) theta = Math.PI - theta
        else theta = Math.PI * 3 - theta
    if (triangularFunction == 'cos') {
        if (thetaUnfixed < 0) theta = Math.PI * 2 - theta
        else theta = - theta
    }
    if (checkAngleBoundaries(theta)) return [theta, true]
    // Out of range
    return [theta, false]
}
*/

function colorCenterRemapping(centers) {
    let centersRemapped = []
    let centersRemappedAgain = []
    let lastCenterTheta = 0

    const u_con = config.confusionLines[config.vision].u
    const v_con = config.confusionLines[config.vision].v
    const thetaPrimeV = config.angleBoundaries[config.vision].thetaPrimeV
    const thetaPrime0 = config.angleBoundaries[config.vision].thetaPrime0
    const thetaPrimeKadd1 = config.angleBoundaries[config.vision].thetaPrimeKadd1

    if (config.debug) {
        log(`Vision: <font color='yellow'>${config.vision}</font>`)
        log("u_con: " + u_con)
        log("v_con: " + v_con)
        log("thetaPrimeV: " + thetaPrimeV)
        log("thetaPrime0: " + thetaPrime0)
        log("thetaPrimeKadd1: " + thetaPrimeKadd1)
        log("m: " + config.m)
    }

    centers.forEach(([u, v], index) => {
        const R = Math.sqrt((u - u_con) ** 2 + (v - v_con) ** 2)
        /*
        const [thetaSin, sinRange] = angleFix(Math.asin((u - u_con) / R),'sin')
        const [thetaCos, cosRange] = angleFix(Math.acos((v - v_con) / R),'cos')
        let theta = thetaSin
        if (Math.abs(thetaCos - thetaSin) > 0.1 && (sinRange && cosRange)) 
            log(`<font color='pink'>Warning: theta calculated by asin and acos does not match up. <br>${thetaSin}, ${thetaCos}</font>`)
        else if (!sinRange && !cosRange)
            log(`<font color='pink'>Warning: theta calculated by asin and acos both out of range? index: ${index}</font>`)
        else if (!sinRange) theta = thetaCos
        else if (!cosRange) theta = thetaSin
        */
        centersRemapped.push([R, Math.asin((u - u_con) / R)])
    })

    centersRemapped.forEach((e, index) => {
        const remappedCenter = e
        if (config.debug) {
            log(`<font color='orange'>------- Center ${index} -------</font>`)
            log("Original Center: " + remappedCenter)
        }
        const thetaPrimeKsub1 = index == 0 ? thetaPrime0 : lastCenterTheta
        lastCenterTheta = e[1]
        const leftHandSide = config.vision == 'tritanopia' ?
            (thetaPrimeKadd1 + thetaPrimeKsub1) / 2
            :
            Math.atan(
                Math.tan(thetaPrimeKadd1 - thetaPrimeV) +
                Math.tan(thetaPrimeKsub1 - thetaPrimeV)
            ) + thetaPrimeV
        const rightHandSide = e[1] + config.m
        if (leftHandSide >= rightHandSide || leftHandSide <= rightHandSide) 
            remappedCenter[1] = e[1] - config.m
        else
            remappedCenter[1] = leftHandSide

        const uBack = u_con + remappedCenter[0] * Math.sin(remappedCenter[1])
        const vBack = v_con + remappedCenter[0] * Math.cos(remappedCenter[1])
        if (config.debug) {
            log("thetaPrimeKsub1: " + thetaPrimeKsub1)
            log("leftHandSide:  " + leftHandSide)
            log("rightHandSide: " + rightHandSide)
            log("Remapped Center: " + remappedCenter)
            log("Remapped Centers in u'v': " + [uBack, vBack])
        }
        centersRemappedAgain.push([uBack, vBack])
    })
    
    return centersRemappedAgain
}

// Step 3: Lightness modification basd on R information

function outputImage(imageData, clusters, centers, rInformation) {
    const data = imageData.data
    let Lflag = false
    const output = new Uint8ClampedArray(data.length)

    log("<font color='orange'>Centers all done!</font>")
    const u_con = config.confusionLines[config.vision].u
    const v_con = config.confusionLines[config.vision].v
 
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
    
        const [L, u, v] = rgbToLuv(r, g, b);
        output[i] = L
        output[i + 1] = 114.514 // error flag
        output[i + 2] = Math.sqrt((u - u_con) ** 2 + (v - v_con) ** 2)  // Rij
        output[i + 3] = data[i + 3] // alpha
    }

    clusters.forEach((cluster,index) => {
        cluster.forEach((e) => {
            i = e * 4
            var [L, u, v] = [output[i], centers[index][0], centers[index][1]]
            L = L + config.b * (output[i + 2] - rInformation[index].Ravg) / (rInformation[index].Rmax - rInformation[index].Rmin)
            if (L > 100) { L = 100, Lflag = true}
            if (L < 0) { L = 0, Lflag = true }
            var rgb = luvToRgb(L, u, v)
            output[i] = rgb[0]
            output[i + 1] = rgb[1]
            output[i + 2] = rgb[2]
        })
    })
    if (Lflag) log(`<font color='pink'>Warning: L out of range!</font>`)
    if (output.indexOf(114.514) != -1)
        log(`<font color='pink'>Error: did not find the corresponding center! Please check data.</font>`)
    const newImageData = new ImageData(output, imageData.width, imageData.height);
    outputImageData = newImageData
    outputContext.putImageData(newImageData, 0, 0);
    refreshColorblindness()
}
