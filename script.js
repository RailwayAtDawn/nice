/* eslint-disable no-redeclare*/
/* eslint-disable no-undef*/
var imageUpload = document.getElementById('imageUpload');
var inputCanvas = document.getElementById('inputCanvas');
var inputContext = inputCanvas.getContext('2d');
var outputCanvas = document.getElementById('outputCanvas');
var outputContext = outputCanvas.getContext('2d');

const config = {
    kmeansClusterNum: 8,
    debug: true,
    m: 10, // maximum movement distance of the remap function
    vision: 'tritanopia',
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

if (config.debug)
    log("<font color='orange'>Debug on!</font>")

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
            inputContext.drawImage(image, 0, 0);
            
            outputCanvas.width = image.width;
			outputCanvas.height = image.height;

            var imageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
			daltonization(imageData)
		};

		image.src = e.target.result;
	};

	reader.readAsDataURL(file);
});

function daltonization(imageData) {
    try{
        var [centers, clusters] = performColorClustering(imageData)
        var centersRemapped = colorCenterRemapping(centers)
        outputImage(imageData, centersRemapped, clusters)
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
        output[i + 1] = 114.514
        output[i + 2] = 0
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
    log(`Cluster numbers: <font color='yellow'>${config.kmeansClusterNum}</font>`)
	return [centers, clusters];
}


// Step 2: Color center remapping
function checkAngleBoundaries(theta) { return theta > config.preprocessAngleBoundaries[config.vision].lowTheta && theta < config.preprocessAngleBoundaries[config.vision].highTheta }
function angleFix(thetaUnfixed, triangularFunction) {
    let theta = thetaUnfixed
    if (checkAngleBoundaries(theta)) return [theta, true]
    else {
        if (triangularFunction == 'sin') theta = Math.PI + theta
        else if (triangularFunction == 'cos') theta = -theta
        else { log("<font color='pink'>Error: triangular function not recognized</font>"); return [114.514, false]}
        if (checkAngleBoundaries(theta)) return [theta, true]
    }
    // Out of range
    return [theta, false]
}

function colorCenterRemapping(centers) {
    const centersRemapped = []

    centers.forEach(([u, v], index) => {
        const u_con = config.confusionLines[config.vision].u
        const v_con = config.confusionLines[config.vision].v
        const R = Math.sqrt((u - u_con) ** 2 + (v - v_con) ** 2)
        const [thetaSin, sinRange] = angleFix(Math.asin((u - u_con) / R),'sin')
        const [thetaCos, cosRange] = angleFix(Math.acos((v - v_con) / R),'cos')
        let theta = thetaSin
        if (Math.abs(thetaCos - thetaSin) > 0.1 && (!sinRange && !cosRange)) 
            log(`<font color='pink'>Warning: theta calculated by asin and acos does not match up. <br>${thetaSin}, ${thetaCos}</font>`)
        else if (sinRange && cosRange)
            log(`<font color='pink'>Warning: theta calculated by asin and acos both out of range? index: ${index}</font>`)
        else if (sinRange) theta = thetaCos
        else if (cosRange) theta = thetaSin
        centersRemapped.push([R, theta])
        console.log(index)
        console.log(centersRemapped)
    })

    console.log(centersRemapped)
    
    centersRemapped.forEach(([R, theta], index) => {
        const remappedCenter = [R, theta]
        const thetaPrimeV = config.confusionLines[config.vision].thetaPrimeV
        const thetaPrime0 = config.confusionLines[config.vision].thetaPrime0
        const thetaPrimeKadd1 = config.confusionLines[config.vision].thetaPrimeKadd1
        const thetaPrimeKsub1 = index == 0 ? thetaPrime0 : centersRemapped[index-1][1]
        const leftHandSide = config.vision == 'tritanopia' ?
            (thetaPrimeKadd1 + thetaPrimeKsub1) / 2
            :
            Math.atan(
                Math.tan(thetaPrimeKadd1 - thetaPrimeV) +
                Math.tan(thetaPrimeKsub1 - thetaPrimeV)
            ) + thetaPrimeV
        const rightHandSide = theta + config.m
        if (leftHandSide >= rightHandSide || leftHandSide <= rightHandSide) 
            remappedCenter[1] = theta - config.m
        else
            remappedCenter[1] = leftHandSide
        centersRemapped[index] = remappedCenter
    })

    log(`Vision: <font color='yellow'>${config.vision}</font>`)
    
    return centersRemapped
}

function outputImage(imageData, clusters, centers) {
    const data = imageData.data
    const output = new Uint8ClampedArray(data.length)
 
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
    
        const L = (rgbToLuv(r, g, b))[0];
        output[i] = L
        output[i + 1] = 114.514
        output[i + 2] = 0
        output[i + 3] = 255
    }

    clusters.forEach((cluster,index) => {
        cluster.forEach((e) => {
            i = e * 4
            var [L, u, v] = [output[i], centers[index][0], centers[index][1]]
            var rgb = luvToRgb(L, u, v)
            output[i] = rgb[0]
            output[i + 1] = rgb[1]
            output[i + 2] = rgb[2]
        })
    })
    if (output.indexOf(114.514) != -1)
        log(`<font color='pink'>Error: did not find the corresponding center! Please check data.</font>`)
    const newImageData = new ImageData(output, imageData.width, imageData.height);
    outputContext.putImageData(newImageData, 0, 0);
}