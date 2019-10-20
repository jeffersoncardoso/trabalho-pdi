var PDI = (function($){

	var GRAY_SCALE_TYPES = [
		'media',
		'grayscale',
		'desaturate',
		'hsv',
	];

	function PDI(){
		this.original = new Image();
		this.image = new Image();
		this.processes = {};
		this.grayScaleType = 'media';

		this.grid = [];

		this.reset();
	}

	PDI.prototype = {
		setGrayScale: function(type){
			this.grayScaleType = type;
		},
		reset: function(){
			this.statistics = {
				average : 0,
				median : 0,
				variance: 0,
				moda : 0,
				totalPx : 0,
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
		loadImagem: function(image, callback){
			var _this = this;
			_this.original.src = URL.createObjectURL(image);
			_this.image.src = URL.createObjectURL(image);
			if(typeof callback == 'function'){
				_this.original.onload = function(){
					callback(_this.original);
					_this.resetImage();
					_this.convertToGrid();
				}
			}
			this.reset();
		},
		resetImage: function(processesToo){
			var _this = this;

			if(processesToo){
				_this.processes = {};
			}

			var tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = _this.original.width;
			tmpCanvas.height = _this.original.height;
			var ctx = tmpCanvas.getContext('2d');
			ctx.drawImage(_this.original, 0, 0);
			_this.image = ctx.getImageData(0, 0, _this.original.width, _this.original.height);

			return [_this.image];
		},
		getImageData: function(){
			var _this = this;
			var tmpCanvas = document.createElement('canvas');

			if(_this.image instanceof Image){
				var image = _this.image;
				tmpCanvas.width = image.width;
				tmpCanvas.height = image.height;
				var ctx = tmpCanvas.getContext('2d');
				ctx.drawImage(image, 0, 0);
				return ctx.getImageData(0, 0, image.width, image.height);
			}
			if(_this.image instanceof ImageData){
				tmpCanvas.width = _this.image.width;
				tmpCanvas.height = _this.image.height;
				var ctx = tmpCanvas.getContext('2d');
				ctx.putImageData(_this.image, 0, 0);
				return ctx.getImageData(0, 0, _this.image.width, _this.image.height);
			}
		},
		getPixelData: function(x, y, imgData){
			var _this = this;

			var width = imgData.width;
			var height = imgData.height;

			var lenStart = (y * width * 4) + x * 4;

			return [
				imgData.data[lenStart],		// red
				imgData.data[lenStart + 1],	// green
				imgData.data[lenStart + 2],	// blue
				imgData.data[lenStart + 3],	// alpha
				lenStart
			];
		},
		applyFilter: function(){
			var _this = this;
			var params = Array.from(arguments);
			var name = params.shift();

			if(params === undefined){
				params = {};
			}
			_this.processes[name] = params;

			return _this.processImage();
		},
		processImage: function(){
			var _this = this;
			_this.resetImage();

			for(var func in _this.processes){
				var params = _this.processes[func];

				_this.image = _this[func].apply(this, params)[0];
			}
			return [_this.image];
		},
		getStatistics: function(){
			return this.statistics;
		},
		getHistogram: function(type){
			var _this = this;
			if(type == 'gray'){
				_this.filterGray();
				return _this.histogram.gray;
			}else
			if(type == 'rgb'){
				var imgData = this.getImageData();
				for (var i = 0; i < imgData.data.length; i += 4) {
					histogram.r[imgData.data[i]]++;
					histogram.g[imgData.data[i + 1]]++;
					histogram.b[imgData.data[i + 2]]++;
				}
			}
		},
		blankMatrix: function(width, height, defaultValue = 255){
			var tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = width;
			tmpCanvas.height = height;
			var ctx = tmpCanvas.getContext('2d');
			return ctx.getImageData(0, 0, width, height);
		},

		// O GRID NAO DEVE SER USADO, APENAS PARA FINS DE CONFERENCIA;
		convertToGrid: function(){
			var _this = this;
			var imgData = _this.getImageData();
			var width = _this.image.width;
			var height = _this.image.height;

			for (var i=0, x=0, y=0; i < imgData.data.length; i += 4, x++){
				if(x == width){
					x = 0;
					y++;
				}

				if(_this.grid[y] === undefined) _this.grid[y] = [];
				if(_this.grid[y][x] === undefined) _this.grid[y][x] = [];

				_this.grid[y][x] = [
					imgData.data[i],
					imgData.data[i+1],
					imgData.data[i+2],
					imgData.data[i+3],
					i
				];
			}
		},

// PROCESSOES DA IMAGEM
		showMatrix:function(matrix, data){
			if(!data){
				for (var y = 0; y < matrix.length; y++){
					console.log('[ '+matrix[y].join(' ')+' ]');
				}
			}else{
				var matrixShow = [];
				for (var y = 0; y < matrixData.length; y++){
					if(matrixShow[y] == undefined) matrixShow[y] = [];

					for (var x = 0; x < matrixData[0].length; x++){
						if(matrixShow[y][x] == undefined) matrixShow[y][x] = [];
						var values = matrixData[y][x];

						matrixShow[y][x] = '[ '+values.join(' ')+' ]';

						_this.showMatrix(matrixShow);
					}
				}
			}
		},
		filterMatrixConvolution: function(matrixData, matrixCalc, callback = null){
			//		  [r, g, b, a]
			var sum = [0, 0, 0, 0];
			for (var y = 0; y < matrixData.length; y++){
				for (var x = 0; x < matrixData[0].length; x++){
					var values = matrixData[y][x];
					var valueCalc = matrixCalc[y][x];

					values.map(function(value, key){
						sum[key] += value * valueCalc;
					});
				}
			}
			if(typeof callback === 'function'){
				sum = callback(sum);
			}
			return sum;
		},
		getMatrixFromData: function(startX, startY, lenX, lenY, imgData){
			var _this = this;

			if(imgData === undefined){
				imgData = _this.getImageData();
			}

			var diff = [];
			var matrix = [];
			for (var y = 0; y < lenY; y++){
				if(matrix[y] == undefined){
					matrix[y] = [];
					diff[y] = [];
				}
				for (var x = 0; x < lenX; x++){
					if(matrix[y][x] == undefined){
						matrix[y][x] = [];
						diff[y][x] = [];
					}
					var nx = (startX + x);
					var ny = (startY + y);
					if(nx < 0 || ny < 0 || nx >= imgData.width || ny >= imgData.height){
						matrix[y][x] = [127, 127, 127, 255];
					}else{
						matrix[y][x] = _this.grid[ny][nx].slice(0);
						diff[y][x] = _this.getPixelData(nx, ny, imgData).slice(0);

						if(matrix[y][x].diff(diff[y][x]).length > 0){
							OriginalConsole.error(matrix[y][x], diff[y][x]);
						}
					}
				}
			}
			return matrix;
		},
		applyFilterMatrix: function(matrix, callback = null){
			var _this = this;

			_this.resetImage(true);

			matrix = [
				[-1, -1, -1],
				[-1,  8, -1],
				[-1, -1, -1],
			];

			matrix = [
				[-1, 0, 0],
				[0, 1, 0],
				[0, 0, 0],
			];

			matrix = [
				[1, 1, 1, 1, 1],
				[1, 0, 0, 0, 1],
				[1, 0, 0, 0, 1],
				[1, 0, 0, 0, 1],
				[1, 1, 1, 1, 1],
			];

			matrix = [
				[0, 1, 0],
				[1, -4, 1],
				[0, 1, 0],
			];

			var mYType = (matrix.length%2 == 0); // true = par | false = impar
			var midY = mYType ? [Math.floor(matrix.length/2), Math.ceil(matrix.length/2)] : [Math.floor(matrix.length/2)];
			var marginY = Math.abs(0 - Math.min.apply(null, midY));

			var mXType = (matrix[0].length%2 == 0);
			var midX = mXType ? [Math.floor(matrix[0].length/2), Math.ceil(matrix[0].length/2)] : [Math.floor(matrix[0].length/2)];
			var marginX = Math.abs(0 - Math.min.apply(null, midX));

			var imgDataOriginal = _this.getImageData();
			var imgData = _this.getImageData();

			var width = imgData.width;
			var height = imgData.height;

			var k = 0;
			for (var i = 0; i <= imgData.data.length; i += 4){
				var y = Math.floor(i/4/width);
				var x = Math.abs(i - y * width * 4)/4;
				
				var matrixData = _this.getMatrixFromData(x - marginX, y - marginY, matrix[0].length, matrix.length, imgDataOriginal);
				var sum = _this.filterMatrixConvolution(matrixData, matrix, function(sum){
					// return sum.map(function(value, index){
					// 	return value/9;
					// });
					return sum;
				});

				if(y == 65 && 10 <= x && x <= 20){
					// console.log(x, y, i);
				}

				imgData.data[i]			= sum[0];	// red
				imgData.data[i + 1]		= sum[1];	// green
				imgData.data[i + 2]		= sum[2];	// blue
				// imgData.data[i + 3]		= sum[3];	// alpha
			}
			return [imgData];
		},

// FILTERS
		getVfromType: function(r, g, b){
			if(this.grayScaleType == 'media'){
				return (r + g + b)/3;
			}else
			if(this.grayScaleType == 'grayscale'){
				return (r*0.3 + g*0.59 + b*0.11);
			}else
			if(this.grayScaleType == 'desaturate'){
				return (Math.max(r,g,b) + Math.min(r,g,b))/2;
			}else
			if(this.grayScaleType == 'hsv'){
				return Math.max(r,g,b);
			}else{
				return (r + g + b)/3;
			}
		},
		filterGray: function(){
			var _this = this;

			var imgData = _this.getImageData();

			var avg = 0;
			var totalPx = 0;
			_this.histogram.gray = Array(256).fill(0);
			for (var i = 0; i < imgData.data.length; i += 4){

				var r = imgData.data[i];		// red
				var g = imgData.data[i + 1];	// green
				var b = imgData.data[i + 2];	// blue
				var a = imgData.data[i + 3];	// alpha
				var v = _this.getVfromType(r, g, b);

				imgData.data[i] = v;
				imgData.data[i + 1] = v;
				imgData.data[i + 2] = v;

				// STATISTICS
				_this.histogram.gray[v]++;

				avg += v;
				totalPx++;
			}
			_this.statistics.average = avg/totalPx;
			_this.statistics.totalPx = totalPx;

			function statisticsComplete(){
				var imgData = _this.getImageData();

				// AVERAGE
				var vrc = 0;
				for (var i = 0; i < imgData.data.length; i += 4){
					var r = imgData.data[i];		// red
					var g = imgData.data[i + 1];	// green
					var b = imgData.data[i + 2];	// blue
					var a = imgData.data[i + 3];	// alpha
					var v = _this.getVfromType(r, g, b);
					vrc += Math.pow(v - _this.statistics.average, 2);
				}
				_this.statistics.variance = vrc/_this.statistics.totalPx;

				// MEDIAN
				imgData.data.sort((a, b) => {
					return b - a;
				});
				_this.statistics.median = imgData.data[imgData.data.length / 2];

				// MODA
				var moda = { px: null, total: 0 };
				_this.histogram.gray.map(function(value, key){
					if(value >= moda.total){
						moda.total = value;
						moda.px = key;
					}
				});
				_this.statistics.moda = moda.px;
			};
			statisticsComplete();

			return [imgData];
		},
		ZhangSuen: function(){
			var _this = this;

			// BINARIZA A IMAGEM
			var imgData = _this.filterGray()[0];
			for (var y = 0, x = 0, i = 0; i < imgData.data.length; i += 4){
				for (let j = 0; j < 3; j++) {
					var binary = (imgData.data[i + j] > 135) ? 255 : 0;
					imgData.data[i + j] = binary;
				}
			}

			var width = imgData.width;

			//             P2		P3		P4		P5		P6		P7		  P8	   P9        P2
			var nbrs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
			//			    0       1       2       3        4       5         6        7         8 

			var nbrGroups = [
				// STAGE
				[
					// P2, P4, P6
					[0, 2, 4],
					// P4, P6, P8
					[2, 4, 6]
				],
				[
					// P2, P4, P8
					[0, 2, 6],
					// P2, P6, P8
					[0, 4, 6]
				]
			];
			function contaVizinhos(x, y, imgData){
				var count = 0;
				for (var i = 0; i < nbrs.length - 1; i++){
					var nx = x + nbrs[i][1];
					var ny = y + nbrs[i][0];
					
					var pixel = _this.getPixelData(nx, ny, imgData);
					if(pixel[0] !== 255){
						count++;
					}
				}
				return count;
			}

			// TRANSICOES DE BRANCO PARA PRETO NA ESFERA
			function countTransicoes(x, y, imgData){
				var count = 0;
				for (var i = 0; i < nbrs.length - 1; i++){
					// Pn
					var Pnx = x + nbrs[i][1];
					var Pny = y + nbrs[i][0];
					var PnPixel = _this.getPixelData(Pnx, Pny, imgData);

					if(PnPixel[0] === 255){
						// Pn + 1
						var Pn1x = x + nbrs[i + 1][1];
						var Pn1y = y + nbrs[i + 1][0];
						var Pn1Pixel = _this.getPixelData(Pn1x, Pn1y, imgData);

						if(Pn1Pixel[0] !== 255){
							count++;
						}
					}
				}
				return count;
			}

			// VERIFICA A PRESENSA DE BRANCO NOS GRUPOS DA PROXIMIDADE
			function atLeastOneIsWhite(r, c, imgData, step){
				var count = 0;
				var group = nbrGroups[step];

				// VERIFICA OS 2 GRUPOS
				for (var i = 0; i < 2; i++){
					// SE AO MENOS 1 DO GRUPO É BRANCO, INCREMENTA O CONTADOR
					for (var j = 0; j < group[i].length; j++) {
						var nbr = nbrs[group[i][j]];

						var nx = r + nbr[1];
						var ny = c + nbr[0];
						var pixel = _this.getPixelData(nx, ny, imgData);

						if (pixel[0] === 255){
							count++;
							break;
						}
					}
				}
				// TEM BRANCO
				return count > 1;
			}

			var listToChange = [];
			var firstStep = false;
			do{
				hasChanged = false;
				firstStep = !firstStep;

				for (var i = 0; i <= imgData.data.length; i += 4){
					var y = Math.floor(i/4/width);
					var x = Math.abs(i - y * width * 4)/4;

					// CONTINUA SE O PIXEL NÃO É PRETO
					if(imgData.data[i] !== 0) continue;

					// CONTA QUANTOS VIZINHOS PRETOS TEM
					var nn = contaVizinhos(x, y, imgData);
					if(nn < 2 || nn > 6) continue;

					// CONTINUA SE NÃO ACHOU NEM UMA ALTERNANCIA
					if(countTransicoes(x, y, imgData) !== 1) continue;

					// CONTINUA SE Ñ TEM BRANCO NOS GRUPOS PROXIMOS
					if(!atLeastOneIsWhite(x, y, imgData, firstStep ? 0 : 1)) continue;

					// ADICIONA AOS PIXELS PARA PINTAR DE BRANCO
					listToChange.push(i);
					hasChanged = true;
				}

				// ALTERA OS PIXELS APENAS APOS TODA CONFERENCIA
				for (var i = 0; i < listToChange.length; i++) {
					var pixelLen = listToChange[i];

					imgData.data[pixelLen]		= 255; // R
					imgData.data[pixelLen + 1]	= 255; // G
					imgData.data[pixelLen + 2]	= 255; // B
					// imgData.data[pixelLen + 3]	= 255; // A
				}
				listToChange = [];
			}while ((firstStep || hasChanged));

			return [imgData];
		}
	}
	return PDI;
}(jQuery));