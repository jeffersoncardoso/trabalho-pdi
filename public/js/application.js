/*! Application - v0.0.0 - 2019-10-16 */
var Application = function($, PDI) {
    window.Pdi = PDI;
    function Application() {
        this.brightness = 0;
        this.contrast = 1;
        this.elements = {
            inputFile: null,
            contentHead: null,
            contentBody: null,
            canvasOri: null,
            canvasChg: null,
            modals: {
                config: null
            }
        };
    }
    Application.prototype = {
        renderOrigin: function(image) {
            var c = this.elements.canvasOri.get(0);
            c.width = image.width;
            c.height = image.height;
            var ctx = c.getContext("2d");
            ctx.drawImage(image, 0, 0);
            var contentResult = this.elements.canvasOri.parents("div.content-image:eq(0)").find(".image-result");
            contentResult.find(".img-size").text(image.width + "x" + image.height);
            var image = PDI.blankMatrix(image.width, image.height);
        },
        loadStatistics: function() {
            var statistics = PDI.getStatistics();
            var contentResult = $(".statistics");
            contentResult.removeClass("d-none");
            contentResult.find(".media span").text(statistics.average.toFixed(2));
            contentResult.find(".mediana span").text(statistics.median);
            contentResult.find(".vari span").text(statistics.variance.toFixed(2));
            contentResult.find(".moda span").text(statistics.moda);
            contentResult.find(".total span").text(statistics.totalPx);
        },
        events: function() {
            var _this = this;
            _this.elements.contentHead.on("click", ".image-upload", function() {
                _this.elements.inputFile.click();
            });
            _this.elements.contentHead.on("click", ".reset", function() {
                var results = PDI.resetImage(true);
                _this.renderResults(results);
            });
            _this.elements.contentHead.on("click", ".zhang_suen", function() {
                var results = PDI.ZhangSuen();
                _this.renderResults(results);
            });
            _this.elements.inputFile.on("change", function(e) {
                PDI.loadImagem(event.target.files[0], function(image) {
                    _this.renderOrigin(image);
                    setTimeout(function() {}, 200);
                });
            });
        },
        renderResults: function(results) {
            var _this = this;
            this.elements.result.html("");
            for (var i in results) {
                var curr = results[i];
                var modelo = this.elements.modelo.clone();
                modelo.removeClass("modelo").addClass("content-image");
                var title = "Resultado";
                modelo.find("h4").html(title);
                var canvas = modelo.find("canvas.canvas-image-change");
                var c = canvas.get(0);
                c.width = curr.width;
                c.height = curr.height;
                var ctx = c.getContext("2d");
                ctx.putImageData(curr, 0, 0);
                var contentResult = modelo.find(".image-result");
                contentResult.find(".img-size").text(curr.width + "x" + curr.height);
                _this.elements.result.append(modelo);
            }
        },
        init: function() {
            this.elements.inputFile = $("#inputFile");
            this.elements.contentHead = $(".main-sidebar");
            this.elements.contentBody = $(".content-wrapper");
            this.elements.canvasOri = this.elements.contentBody.find("#canvas-image-origin");
            this.elements.canvasChg = this.elements.contentBody.find("#canvas-image-change");
            this.elements.modals.config = $("div.modal#configuration");
            this.elements.modelo = $(".content-wrapper .modelo");
            this.elements.result = $(".content-wrapper .results");
            this.events();
            return this;
        }
    };
    return new Application();
}(jQuery, new PDI());

Application.init();