/*! Application - v0.0.0 - 2019-10-16 */
var PDI = function($) {
    var GRAY_SCALE_TYPES = [ "media", "grayscale", "desaturate", "hsv" ];
    function PDI() {
        this.original = new Image();
        this.image = new Image();
        this.processes = {};
        this.grayScaleType = "media";
        this.grid = [];
        this.reset();
    }
    PDI.prototype = {
        setGrayScale: function(type) {
            this.grayScaleType = type;
        },
        reset: function() {
            this.statistics = {
                average: 0,
                median: 0,
                variance: 0,
                moda: 0,
                totalPx: 0
            };
            this.histogram = {};
            this.histogram.gray = Array(256).fill(0);
            this.histogram.rgb = {
                r: Array(256).fill(0),
                g: Array(256).fill(0),
                b: Array(256).fill(0)
            };
            this.grid = [];
        },
        loadImagem: function(image, callback) {
            var _this = this;
            _this.original.src = URL.createObjectURL(image);
            _this.image.src = URL.createObjectURL(image);
            if (typeof callback == "function") {
                _this.image.onload = function() {
                    callback(_this.image);
                    _this.resetImage();
                    _this.convertToGrid();
                };
            }
            this.reset();
        },
        resetImage: function(processesToo) {
            var _this = this;
            if (processesToo) {
                _this.processes = {};
            }
            var tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = _this.original.width;
            tmpCanvas.height = _this.original.height;
            var ctx = tmpCanvas.getContext("2d");
            ctx.drawImage(_this.original, 0, 0);
            _this.image = ctx.getImageData(0, 0, _this.original.width, _this.original.height);
            return [ _this.image ];
        },
        getImageData: function() {
            var _this = this;
            var tmpCanvas = document.createElement("canvas");
            if (_this.image instanceof Image) {
                var image = _this.image;
                tmpCanvas.width = image.width;
                tmpCanvas.height = image.height;
                var ctx = tmpCanvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
                return ctx.getImageData(0, 0, image.width, image.height);
            }
            if (_this.image instanceof ImageData) {
                tmpCanvas.width = _this.image.width;
                tmpCanvas.height = _this.image.height;
                var ctx = tmpCanvas.getContext("2d");
                ctx.putImageData(_this.image, 0, 0);
                return ctx.getImageData(0, 0, _this.image.width, _this.image.height);
            }
        },
        getPixelData: function(x, y, imgData) {
            var _this = this;
            var width = imgData.width;
            var height = imgData.height;
            var lenStart = y * width * 4 + x * 4;
            return [ imgData.data[lenStart], imgData.data[lenStart + 1], imgData.data[lenStart + 2], imgData.data[lenStart + 3], lenStart ];
        },
        applyFilter: function() {
            var _this = this;
            var params = Array.from(arguments);
            var name = params.shift();
            if (params === undefined) {
                params = {};
            }
            _this.processes[name] = params;
            return _this.processImage();
        },
        processImage: function() {
            var _this = this;
            _this.resetImage();
            for (var func in _this.processes) {
                var params = _this.processes[func];
                _this.image = _this[func].apply(this, params)[0];
            }
            return [ _this.image ];
        },
        getStatistics: function() {
            return this.statistics;
        },
        getHistogram: function(type) {
            var _this = this;
            if (type == "gray") {
                _this.filterGray();
                return _this.histogram.gray;
            } else if (type == "rgb") {
                var imgData = this.getImageData();
                for (var i = 0; i < imgData.data.length; i += 4) {
                    histogram.r[imgData.data[i]]++;
                    histogram.g[imgData.data[i + 1]]++;
                    histogram.b[imgData.data[i + 2]]++;
                }
            }
        },
        blankMatrix: function(width, height, defaultValue = 255) {
            var tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = width;
            tmpCanvas.height = height;
            var ctx = tmpCanvas.getContext("2d");
            return ctx.getImageData(0, 0, width, height);
        },
        convertToGrid: function() {
            var _this = this;
            var imgData = _this.getImageData();
            var width = _this.image.width;
            var height = _this.image.height;
            for (var i = 0, x = 0, y = 0; i < imgData.data.length; i += 4, x++) {
                if (x == width) {
                    x = 0;
                    y++;
                }
                if (_this.grid[y] === undefined) _this.grid[y] = [];
                if (_this.grid[y][x] === undefined) _this.grid[y][x] = [];
                _this.grid[y][x] = [ imgData.data[i], imgData.data[i + 1], imgData.data[i + 2], imgData.data[i + 3], i ];
            }
        },
        showMatrix: function(matrix, data) {
            if (!data) {
                for (var y = 0; y < matrix.length; y++) {
                    console.log("[ " + matrix[y].join(" ") + " ]");
                }
            } else {
                var matrixShow = [];
                for (var y = 0; y < matrixData.length; y++) {
                    if (matrixShow[y] == undefined) matrixShow[y] = [];
                    for (var x = 0; x < matrixData[0].length; x++) {
                        if (matrixShow[y][x] == undefined) matrixShow[y][x] = [];
                        var values = matrixData[y][x];
                        matrixShow[y][x] = "[ " + values.join(" ") + " ]";
                        _this.showMatrix(matrixShow);
                    }
                }
            }
        },
        filterMatrixConvolution: function(matrixData, matrixCalc, callback = null) {
            var sum = [ 0, 0, 0, 0 ];
            for (var y = 0; y < matrixData.length; y++) {
                for (var x = 0; x < matrixData[0].length; x++) {
                    var values = matrixData[y][x];
                    var valueCalc = matrixCalc[y][x];
                    values.map(function(value, key) {
                        sum[key] += value * valueCalc;
                    });
                }
            }
            if (typeof callback === "function") {
                sum = callback(sum);
            }
            return sum;
        },
        getMatrixFromData: function(startX, startY, lenX, lenY, imgData) {
            var _this = this;
            if (imgData === undefined) {
                imgData = _this.getImageData();
            }
            var diff = [];
            var matrix = [];
            for (var y = 0; y < lenY; y++) {
                if (matrix[y] == undefined) {
                    matrix[y] = [];
                    diff[y] = [];
                }
                for (var x = 0; x < lenX; x++) {
                    if (matrix[y][x] == undefined) {
                        matrix[y][x] = [];
                        diff[y][x] = [];
                    }
                    var nx = startX + x;
                    var ny = startY + y;
                    if (nx < 0 || ny < 0 || nx >= imgData.width || ny >= imgData.height) {
                        matrix[y][x] = [ 127, 127, 127, 255 ];
                    } else {
                        matrix[y][x] = _this.grid[ny][nx].slice(0);
                        diff[y][x] = _this.getPixelData(nx, ny, imgData).slice(0);
                        if (matrix[y][x].diff(diff[y][x]).length > 0) {
                            OriginalConsole.error(matrix[y][x], diff[y][x]);
                        }
                    }
                }
            }
            return matrix;
        },
        applyFilterMatrix: function(matrix, callback = null) {
            var _this = this;
            _this.resetImage(true);
            matrix = [ [ -1, -1, -1 ], [ -1, 8, -1 ], [ -1, -1, -1 ] ];
            matrix = [ [ -1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 0 ] ];
            matrix = [ [ 1, 1, 1, 1, 1 ], [ 1, 0, 0, 0, 1 ], [ 1, 0, 0, 0, 1 ], [ 1, 0, 0, 0, 1 ], [ 1, 1, 1, 1, 1 ] ];
            matrix = [ [ 0, 1, 0 ], [ 1, -4, 1 ], [ 0, 1, 0 ] ];
            var mYType = matrix.length % 2 == 0;
            var midY = mYType ? [ Math.floor(matrix.length / 2), Math.ceil(matrix.length / 2) ] : [ Math.floor(matrix.length / 2) ];
            var marginY = Math.abs(0 - Math.min.apply(null, midY));
            var mXType = matrix[0].length % 2 == 0;
            var midX = mXType ? [ Math.floor(matrix[0].length / 2), Math.ceil(matrix[0].length / 2) ] : [ Math.floor(matrix[0].length / 2) ];
            var marginX = Math.abs(0 - Math.min.apply(null, midX));
            var imgDataOriginal = _this.getImageData();
            var imgData = _this.getImageData();
            var width = imgData.width;
            var height = imgData.height;
            var k = 0;
            for (var i = 0; i <= imgData.data.length; i += 4) {
                var y = Math.floor(i / 4 / width);
                var x = Math.abs(i - y * width * 4) / 4;
                var matrixData = _this.getMatrixFromData(x - marginX, y - marginY, matrix[0].length, matrix.length, imgDataOriginal);
                var sum = _this.filterMatrixConvolution(matrixData, matrix, function(sum) {
                    return sum;
                });
                if (y == 65 && 10 <= x && x <= 20) {}
                imgData.data[i] = sum[0];
                imgData.data[i + 1] = sum[1];
                imgData.data[i + 2] = sum[2];
            }
            return [ imgData ];
        },
        getVfromType: function(r, g, b) {
            if (this.grayScaleType == "media") {
                return (r + g + b) / 3;
            } else if (this.grayScaleType == "grayscale") {
                return r * .3 + g * .59 + b * .11;
            } else if (this.grayScaleType == "desaturate") {
                return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
            } else if (this.grayScaleType == "hsv") {
                return Math.max(r, g, b);
            } else {
                return (r + g + b) / 3;
            }
        },
        filterGray: function() {
            var _this = this;
            var imgData = _this.getImageData();
            var avg = 0;
            var totalPx = 0;
            _this.histogram.gray = Array(256).fill(0);
            for (var i = 0; i < imgData.data.length; i += 4) {
                var r = imgData.data[i];
                var g = imgData.data[i + 1];
                var b = imgData.data[i + 2];
                var a = imgData.data[i + 3];
                var v = _this.getVfromType(r, g, b);
                imgData.data[i] = v;
                imgData.data[i + 1] = v;
                imgData.data[i + 2] = v;
                _this.histogram.gray[v]++;
                avg += v;
                totalPx++;
            }
            _this.statistics.average = avg / totalPx;
            _this.statistics.totalPx = totalPx;
            function statisticsComplete() {
                var imgData = _this.getImageData();
                var vrc = 0;
                for (var i = 0; i < imgData.data.length; i += 4) {
                    var r = imgData.data[i];
                    var g = imgData.data[i + 1];
                    var b = imgData.data[i + 2];
                    var a = imgData.data[i + 3];
                    var v = _this.getVfromType(r, g, b);
                    vrc += Math.pow(v - _this.statistics.average, 2);
                }
                _this.statistics.variance = vrc / _this.statistics.totalPx;
                imgData.data.sort((a, b) => {
                    return b - a;
                });
                _this.statistics.median = imgData.data[imgData.data.length / 2];
                var moda = {
                    px: null,
                    total: 0
                };
                _this.histogram.gray.map(function(value, key) {
                    if (value >= moda.total) {
                        moda.total = value;
                        moda.px = key;
                    }
                });
                _this.statistics.moda = moda.px;
            }
            statisticsComplete();
            return [ imgData ];
        },
        ZhangSuen: function() {
            var _this = this;
            var imgData = _this.filterGray()[0];
            for (var y = 0, x = 0, i = 0; i < imgData.data.length; i += 4) {
                for (let j = 0; j < 3; j++) {
                    var binary = imgData.data[i + j] > 150 ? 255 : 0;
                    imgData.data[i + j] = binary;
                }
            }
            var width = imgData.width;
            for (var i = 0; i <= imgData.data.length; i += 4) {
                var y = Math.floor(i / 4 / width);
                var x = Math.abs(i - y * width * 4) / 4;
                var pixelAtual = _this.getPixelData(x, y, imgData);
                pixelAtual[0];
                pixelAtual[1];
                pixelAtual[2];
                pixelAtual[3];
                imgData.data[i] = 255;
                imgData.data[i + 1] = 255;
                imgData.data[i + 2] = 255;
                imgData.data[i + 3] = 255;
            }
            return [ imgData ];
        }
    };
    return PDI;
}(jQuery);