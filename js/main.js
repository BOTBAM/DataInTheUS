// Loading the dataset & processing CSV data for histograms & scatterplot FIRST (The amount of times I incorrectly used parenthesies where square brackets are meant to be and vise versa is comical)
d3.csv("./data/national_health_data_2024.csv").then(data =>
{
	data = data.filter(d => +d.percent_coronary_heart_disease !== -1 && +d.poverty_perc !== -1); // Added a filter to ignore counties with % values of -1, to account for lack of data respectively
	data.forEach(d =>
	{
		d.poverty_perc = +d.poverty_perc;
        d.chd_perc = +d.percent_coronary_heart_disease;
        d.cholesterol_perc = +d.percent_high_cholesterol;
        d.income = +d.median_household_income;
        d.inactivity_perc = +d.percent_inactive;
        d.smoking_perc = +d.percent_smoking;
        d.bp_perc = +d.percent_high_blood_pressure;
    });

	const width = 500, height = 400;

	function createHistogram(selector, dataKey, title)
	{
		const svg = d3.select(selector)
			.append("svg")
			.attr("width", width)
			.attr("height", height);
		
		const x = d3.scaleLinear()
			.domain([0, d3.max(data, d => d[dataKey])])
			.nice()
			.range([40, width - 30]);
		
		const histogram = d3.histogram()
			.domain(x.domain())
			.thresholds(x.ticks(30))
			.value(d => d[dataKey]);
		
		const bins = histogram(data);
		
		const y = d3.scaleLinear()
			.domain([0, d3.max(bins, d => d.length)])
			.range([height - 40, 40]);
		
		const g = svg.append("g").attr("transform", 'translate(40,0)');
		
		g.append("g").attr("transform", `translate(0,${height - 40})`)
			.attr("transform", `translate(0,${height - 40})`) // Side comment: I spent SO much time trying to figure out why the x-axis kept appearing at the top of my chart rather
															  // than the bottom, only to find out that the translate function *HAS* to be placed in single quotes,'', syntaxically
			.call(d3.axisBottom(x))
			.append("text")
			.attr("fill", "black")
			.attr("x", width / 2)
			.attr("y", 35)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.text("Percentage affected (%)")
			
		
		g.append("g").attr("transform", `translate(40,0)`)
            .call(d3.axisLeft(y).ticks(10))
            .append("text")
            .attr("fill", "black")
            .attr("transform", "rotate(-90)")
            .attr("y", -35)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Counties (count)");
		// Determine color based on attribute

		let barColor = dataKey === "poverty_perc" ? "#199544" : "#922c38";

        g.selectAll("rect").data(bins).enter().append("rect")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => x(d.x1) - x(d.x0) - 1)
        .attr("height", d => height - 40 - y(d.length))
        .attr("fill", barColor) // Apply the appropriate color
        .on("mouseover", (event, d) =>
		{
            d3.select("#tooltip").style("display", "block")
                .html(`Range: ${d.x0.toFixed(2)}% - ${d.x1.toFixed(2)}%<br>Counties: ${d.length}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => d3.select("#tooltip").style("display", "none"));
		
		g.append("text")
			.attr("x", width / 2)
			.attr("y", height - 375)
			.attr("text-anchor", "middle")
			.style("font-size", "22px")
			.text(title);
	}

	createHistogram("#histogram-poverty", "poverty_perc", "Poverty Percentage Distribution");
	createHistogram("#histogram-chd", "chd_perc", "CHD Percentage Distribution");

	function createScatterPlot()
	{
		const svg = d3.select("#scatterplot")
			.append("svg")
			.attr("width", width)
			.attr("height", height);
		
		const x = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.poverty_perc)])
			.nice()
			.range([40, width - 20]);
		
		const y = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.chd_perc)])
			.nice()
			.range([height - 40, 40]);
		
		const g = svg.append("g").attr("transform", 'translate(40,0)');
		
		g.append("g").attr("transform", `translate(0,${height - 40})`).call(d3.axisBottom(x))
            .append("text").attr("fill", "black").attr("x", width / 2).attr("y", 35)
            .attr("text-anchor", "middle").style("font-size", "14px").text("Poverty Percentage");

        g.append("g").attr("transform", `translate(40,0)`).call(d3.axisLeft(y))
            .append("text").attr("fill", "black").attr("transform", "rotate(-90)")
            .attr("y", -35).attr("x", -height / 2).attr("text-anchor", "middle")
            .style("font-size", "14px").text("Percentage CHD");

        g.selectAll("circle").data(data).enter().append("circle")
            .attr("cx", d => x(d.poverty_perc)).attr("cy", d => y(d.chd_perc)).attr("r", 2).attr("fill", "steelblue")
            .on("mouseover", (event, d) =>
			{
                d3.select("#tooltip").style("display", "block")
                    .html(`County: ${d.cnty_fips}<br>Poverty: ${d.poverty_perc}%<br>CHD: ${d.chd_perc}%`)
                    .style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", () => d3.select("#tooltip").style("display", "none"));

		
		g.append("text")
			.attr("x", width / 2)
			.attr("y", height - 375)
			.attr("text-anchor", "middle")
			.style("font-size", "22px")
			.text("Poverty vs CHD Correlation");
	}

	createScatterPlot();
});

Promise.all(
	[
		d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
		d3.csv("./data/national_health_data_2024.csv")
	]).then(([us, data]) =>
		{
			data = data.map(d =>
			({
				cnty_fips: d.cnty_fips,
				poverty_perc: +d.poverty_perc,
				percent_coronary_heart_disease: +d.percent_coronary_heart_disease,
				percent_high_cholesterol: +d.percent_high_cholesterol,
				income: +d.median_household_income,
				inactivity_perc: +d.percent_inactive,
				smoking_perc: +d.percent_smoking,
				bp_perc: +d.percent_high_blood_pressure
			}));

			// Create a map of county IDs to health data
			const counties = topojson.feature(us, us.objects.counties).features;
			const dataMap = new Map(data.map(d => [d.cnty_fips,
			{
				poverty: d.poverty_perc,
				chd: d.percent_coronary_heart_disease,
				cholesterol: d.percent_high_cholesterol,
				income: d.income,
				inactivity_perc: d.inactivity_perc,
				smoking_perc: d.smoking_perc,
				bp_perc: d.bp_perc
			}]));

			// Set projection
			const width = 960, height = 600;
			const projection = d3.geoAlbersUsa().fitSize([width, height], topojson.feature(us, us.objects.counties));
			const path = d3.geoPath().projection(projection);

			// Color scales
			const colorScales =
			{
				poverty: d3.scaleLinear()
					.domain([d3.min(data, d => +d.poverty_perc), d3.max(data, d => +d.poverty_perc)])
					.range(["#f7fcf0", "#00441b"]), // Light green to dark green

				chd: d3.scaleLinear()
					.domain([d3.min(data, d => +d.percent_coronary_heart_disease), d3.max(data, d => +d.percent_coronary_heart_disease)])
					.range(["#ffffff", "#67000d"]), // White to dark red

				cholesterol: d3.scaleLinear()
					.domain([d3.min(data, d => +d.percent_high_cholesterol), d3.max(data, d => +d.percent_high_cholesterol)])
					.range(["#f7fbff", "#08306b"]), // Light blue to dark blue
				
				income: d3.scaleLinear()
					.domain([d3.min(data, d => +d.income), d3.max(data, d => +d.income)])
					.range(["#ffffcc", "#800026"]), // Light yellow → Dark red
	
				inactivity_perc: d3.scaleLinear()
					.domain([d3.min(data, d => +d.inactivity_perc), d3.max(data, d => +d.inactivity_perc)])
					.range(["#fff5eb", "#d94801"]), // Light orange → Deep orange
	
				smoking_perc: d3.scaleLinear()
					.domain([d3.min(data, d => +d.smoking_perc), d3.max(data, d => +d.smoking_perc)])
					.range(["#deebf7", "#08306b"]), // Light blue → Dark navy blue
	
				bp_perc: d3.scaleLinear()
					.domain([d3.min(data, d => +d.bp_perc), d3.max(data, d => +d.bp_perc)])
					.range(["#fee0d2", "#a50f15"]) // Light red → Dark red
			};

			let selectedAttribute = "poverty";


			function updateLegend(attribute)
			{
				const scale = colorScales[attribute];
				// Extract min/max values from data (had to drop idea, cant figure it out)
				const minValue = d3.min(data, d => +d[attribute]);
				const maxValue = d3.max(data, d => +d[attribute]);

				// Update color gradient
				d3.select("#color-legend")
        			.style("background", `linear-gradient(to right, ${scale.range()[0]}, ${scale.range()[1]})`);
			
			}

			// Initialize Legend with Default Attribute
			updateLegend("poverty");

			// Update legend on dropdown change
			d3.select("#attribute-selector").on("change", function ()
			{
				selectedAttribute = this.value;
				updateLegend(selectedAttribute);
				map.selectAll(".county")
					.transition()
					.duration(500)
					.attr("fill", d =>
						{
						const val = dataMap.get(d.id)?.[selectedAttribute];
						return val !== undefined ? colorScales[selectedAttribute](val) : "#ccc";
					});
			});

			// Append SVG **ONLY** inside #map, prevent adding anything to <body>
			const svg = d3.select("#map").append("svg")
				.attr("width", width)
				.attr("height", height);

			const map = svg.append("g");

			// Draw counties
			map.selectAll(".county")
				.data(counties)
				.enter().append("path")
				.attr("class", "county")
				.attr("d", path)
				.attr("fill", d =>
					{
						const val = dataMap.get(d.id)?.[selectedAttribute];
						return val !== undefined ? colorScales[selectedAttribute](val) : "#ccc";
					})
				.on("mouseover", (event, d) =>
				{
					const val = dataMap.get(d.id)?.[selectedAttribute];
					d3.select("#tooltip")
						.style("display", "block")
						.html(`County: ${d.id}<br>${selectedAttribute}: ${val !== undefined ? val.toFixed(2) : "N/A"}`)
						.style("left", `${event.pageX + 10}px`)
						.style("top", `${event.pageY + 10}px`);
				})
				.on("mouseout", () => d3.select("#tooltip").style("display", "none"));

			// Add tooltip div, but DO NOT add anything to body directly
			d3.select("#map").append("div")
				.attr("id", "tooltip")
				.style("position", "absolute")
				.style("background", "white")
				.style("border", "1px solid black")
				.style("padding", "5px")
				.style("display", "none");
			
	}
);

