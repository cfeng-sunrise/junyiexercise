$.extend(KhanUtil, {
    Polynomial: function(minDegree, maxDegree, coefs, variable, name) {
	        var term = function(coef, vari, degree) {

            // sort of a weird error behavior
            if (typeof coef === "undefined" || coef === 0) {
                return null;
            }
			
            if (degree === 0) {
                return coef;
            } else if (degree === 1) {
                return ["*", coef, vari];
            } else {
                return ["*", coef, ["^", vari, degree]];
            }

        };

        // inverse of term.    Given an expression it returns the coef and degree.
        // calculus needs this for hints
        var extractFromExpr = function(expr) {
            var coef, degree;
            if (typeof expr === "number") {
                coef = expr;
                degree = 0;
            } else if ($.isArray(expr) && !$.isArray(expr[2])) {
                coef = expr[1];
                degree = 1;
            } else if ($.isArray(expr) && $.isArray(expr[2])) {
                coef = expr[1];
                degree = expr[2][2];
            }
            return {
                coef: coef,
                degree: degree
            };
        };

        // These seem royally useless to me
        if (maxDegree >= minDegree) {
            this.minDegree = minDegree;
            this.maxDegree = maxDegree;
        } else {
            this.minDegree = maxDegree;
            this.maxDegree = minDegree;
        }

        this.coefs = coefs || KhanUtil.randCoefs(this.minDegree, this.maxDegree);

        this.variable = (typeof variable !== "undefined") ? variable : "x";

        this.name = name || "f";

        this.findMaxDegree = function(coefs) {
            if (!coefs) {
                for (var i = this.maxDegree; i >= this.minDegree; i--) {
                    if (this.coefs[i] !== 0) {
                        return i;
                    }
                }
            } else {
                for (var i = coefs.length - 1; i >= 0; i--) {
                    if (coefs[i] !== 0) {
                        return i;
                    }
                }
                return -1;
            }
        };

        this.findMinDegree = function(coefs) {
            if (!coefs) {
                for (var i = this.minDegree; i <= this.maxDegree; i++) {
                    if (this.coefs[i] !== 0) {
                        return i;
                    }
                }
            } else {
                for (var i = 0; i < coefs.length; i++) {
                    if (coefs[i] !== 0) {
                        return i;
                    }
                }
                return -1;
            }
        };

        this.expr = function(vari) {
            if (typeof vari === "undefined") {
                vari = this.variable;
            }

            var expr = ["+"];

            for (var i = this.maxDegree; i >= this.minDegree; i--) {
                var theTerm = term(this.coefs[i], vari, i);

                if (theTerm != null) {
                    expr.push(theTerm);
                }
            }

            return expr;
        };

        this.getNumberOfTerms = function() {

            // -1 as the first term in the expression for a polynomial is always a "+"
            return this.expr().length - 1;

        };

        this.getCoefAndDegreeForTerm = function(termIndex) {

            //returns the coef and degree for a particular term
            var numberOfTerms = this.getNumberOfTerms();

            //mod twice to always get positive
            termIndex = ((termIndex % numberOfTerms) + numberOfTerms) % numberOfTerms;

            //upshift by one due to "+" sign at the front of the expression
            return extractFromExpr(this.expr()[termIndex + 1]);

        };

		this.Term = function(termIndex){
			//returns the coef and degree for a particular term
            var numberOfTerms = this.getNumberOfTerms();

            //mod twice to always get positive
            termIndex = ((termIndex % numberOfTerms) + numberOfTerms) % numberOfTerms;

            //upshift by one due to "+" sign at the front of the expression
            return KhanUtil.expr(this.expr()[termIndex + 1]);	
		};

        this.text = function() {
            return KhanUtil.expr(this.expr(this.variable));
        };

        this.toString = this.text;

        this.hintEvalOf = function(val) {
            return KhanUtil.expr(this.expr(val));
        };

        this.evalOf = function(val) {
            return KhanUtil.expr(this.expr(val), true);
        };

        this.hint = function(val) {
            var hints = [];
            hints.push("<p><code>" + this.name + "(" + val + ") = " +
                this.hintEvalOf(val) + "</code></p>");
            hints.push("<p><code>" + this.name + "(" + val + ") = " +
                this.evalOf(val) + "</code></p>");

            return hints;
        };

        // Adds two polynomials
        // It assumes the second polynomial's variable is the same as the first polynomial's
        // Does not change the polynomials, returns the result
        this.add = function(polynomial) {
            var coefs = [];
            var minDegree = Math.min(this.minDegree, polynomial.minDegree);
            var maxDegree = Math.max(this.maxDegree, polynomial.maxDegree);

            for (var i = minDegree; i <= maxDegree; i++) {
                var value = 0;

                value += i <= this.maxDegree ? this.coefs[i] : 0;
                value += i <= polynomial.maxDegree ? polynomial.coefs[i] : 0;

                coefs[i] = value;
            }
			// Fill in any missing values of coefs with 0s
            for (var i = 0; i < coefs.length; i++) {
				if (coefs[i] === undefined) {
					coefs[i] = 0;
				}
            }
            return new KhanUtil.Polynomial(minDegree, maxDegree, coefs, this.variable);
        };

        // Subtracts polynomial from this
        // It assumes the second polynomial's variable is the same as the first polynomial's
        // Does not change the polynomials, returns the result
        this.subtract = function(value) {
			var coefs = [];
            if (typeof value === "number") {

				for (var i = 0; i < this.coefs.length; i++) {
                    coefs[i] = this.coefs[i];
                }

                coefs[0] = coefs[0] - value;

                return new KhanUtil.Polynomial(this.minDegree, this.maxDegree, coefs, this.variable);

            // Assume if it's not a number it's a polynomial
            } else {
				return this.add(value.multiply(-1));
			}
        }

        // Multiply a polynomial by a number or other polynomial
        this.multiply = function(value) {
            var coefs = [];
            if (typeof value === "number") {

                for (var i = 0; i < this.coefs.length; i++) {
                    coefs[i] = this.coefs[i] * value;
                }

                return new KhanUtil.Polynomial(this.minDegree, this.maxDegree, coefs, this.variable);

            // Assume if it's not a number it's a polynomial
            } else {
                for (var i = this.minDegree; i <= this.maxDegree; i++) {
                    if (this.coefs[i] === 0) {
                        continue;
                    }
                    for (var j = value.minDegree; j <= value.maxDegree; j++) {
                        if (value.coefs[j] === 0) {
                            continue;
                        }

                        var coef = this.coefs[i] * value.coefs[j];

                        if (coefs[i + j] === undefined) {
                            coefs[i + j] = coef;
                        } else {
                            coefs[i + j] += coef;
                        }
                    }
                }

                // Fill in any missing values of coefs with 0s
                for (var i = 0; i < coefs.length; i++) {
                    if (coefs[i] === undefined) {
                        coefs[i] = 0;
                    }
                }

                return new KhanUtil.Polynomial(Math.min(this.minDegree, value.minDegree), coefs.length-1, coefs, this.variable);
            }
        }
		
		// Divide a polynomial by a number or other polynomial
		this.divideBase = function(dividor) 
		{
			var coefs = [];
			var i = this.maxDegree;
			var j = dividor.maxDegree;
			
			if(i >= j)
				coefs[i-j] = this.coefs[i] / dividor.coefs[j];

            // Fill in any missing values of coefs with 0s
            for (var k = 0; k < coefs.length; k++) {
				if (coefs[k] === undefined) {
					coefs[k] = 0;
                }
            }

			return new KhanUtil.Polynomial(0, coefs.length-1, coefs, this.variable);
		}

		this.divide = function(dividor) 
		{
			var resEnd = []; 
			var coefs2 = [];
			var coefs4 = [];

			var i = this.findMaxDegree(this.coefs);
			var j = dividor.findMaxDegree(dividor.coefs);
			var divRes = [];

			coefs2[i] = this.coefs[i];
            // Fill in any missing values of coefs with 0s
            for (var k = 0; k < coefs2.length; k++) {
				if (coefs2[k] === undefined) {
					coefs2[k] = 0;
                }
            }
			var divideMax = new KhanUtil.Polynomial(0, i, coefs2, this.variable);

			coefs4[j] = dividor.coefs[j];
            // Fill in any missing values of coefs with 0s
            for (var k = 0; k < coefs4.length; k++) {
				if (coefs4[k] === undefined) {
					coefs4[k] = 0;
                }
            }
			var dividorMax = new KhanUtil.Polynomial(0, j, coefs4, this.variable);

			var tmpDiviValue1 = divideMax.divideBase(dividorMax);

			var tmpDiviValue2 = tmpDiviValue1.multiply(dividor);

			var tmpDiviValue3 = this.subtract(tmpDiviValue2);

			if(tmpDiviValue3.findMaxDegree(tmpDiviValue3.coefs) < dividor.findMaxDegree(dividor.coefs) ||
				tmpDiviValue3.coefs[tmpDiviValue3.findMaxDegree(tmpDiviValue3.coefs)] === 0)
			{
				resEnd.push(tmpDiviValue3.coefs[tmpDiviValue3.minDegree]);
				resEnd.push(tmpDiviValue1);
				return resEnd;
			}

			resEnd = tmpDiviValue3.divide(dividor);

			resEnd[1] = tmpDiviValue1.add(resEnd[1]);

			return resEnd;
		};
		
        return this;
    },

    CompositePolynomial: function(minDegree, maxDegree, coefs, variable, name,
            composed, composedCoef) {
        var base = new KhanUtil.Polynomial(
            minDegree, maxDegree, coefs, variable, name);

        $.extend(this, base);

        if (!composedCoef) {
            composedCoef = KhanUtil.randRangeNonZero(-5, 5);
        }
        var composedFunc = composed.name + "(" + this.variable + ")";

        var tackOn = function(expr, tack) {
            expr = $.merge([], expr);

            if (expr[0] === "+") {
                expr.push(tack);
            } else {
                expr = ["+", expr, tack];
            }

            return expr;
        };

        this.expr = function(vari) {
            return tackOn(base.expr(vari), ["*", composedCoef, composedFunc]);
        };

        this.text = function() {
            return KhanUtil.expr(this.expr(this.variable));
        };

        this.toString = this.text;

        this.hintEvalOf = function(val, evalInner) {
            if (evalInner) {

                return KhanUtil.expr(tackOn(base.expr(val),
                    ["*", composedCoef, composed.evalOf(val)]));

            } else {

                return KhanUtil.expr(tackOn(base.expr(val),
                    ["*", composedCoef, composed.name + "(" + val + ")"]));

            }
        };

        this.evalOf = function(val) {
            return base.evalOf(val) + composedCoef * composed.evalOf(val);
        };

        this.hint = function(val) {
            var hints = [];
            hints.push("<p><code>" + this.name + "(" + val + ") = " +
                this.hintEvalOf(val) + "</code></p>");

            var composedFuncWithVal = composed.name + "(" + val + ")";

            hints.push("<p>為了解決 <code>" + this.name + "</code>的數值，"
                + "我們需要先解決 <code>"
                + composedFuncWithVal + "</code>的數值。</p>");

            hints = hints.concat(composed.hint(val));

            hints.push("<p>這表示 <code>" + this.name + "(" + val + ") = " +
                this.hintEvalOf(val, true) + "</code></p>");

            hints.push("<p><code>" + this.name + "(" + val + ") = " +
                this.evalOf(val) + "</code></p>");

            return hints;

        };

        return this;

    },

    randCoefs: function randCoefs(minDegree, maxDegree) {
        var coefs = [];
        var allZero = true;

        for (var i = maxDegree; i >= minDegree; i--) {
            coefs[i] = KhanUtil.randRange(-7, 7);
            allZero = allZero && coefs[i] === 0;
        }

        return allZero ? randCoefs(minDegree, maxDegree) : coefs;
    }	
});
