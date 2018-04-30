var svg = d3.select("svg"),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

var color = d3.scaleLinear()
              .domain([-1, 5])
              .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
              .interpolate(d3.interpolateHcl);

var pack = d3.pack()
            .size([diameter - margin, diameter - margin])
            .padding(2);

// data
let surveyData = {
  name: "StackOverFlowSurvey",
  children: []
}
// end of data

// csv
d3.csv('./survey_results_public.csv', function(d, i) {
  return {
    no: i+1,
    professional: d.Professional,
    programhobby: d.ProgramHobby,
    country: d.Country,
    university: d.University,
    employmentstatus: d.EmploymentStatus,
    formaleducation: d.FormalEducation,
    majorundergrad: d.MajorUndergrad,
    companysize: d.CompanySize,
    companytype: d.CompanyType,
  }
}).then(dataJSON => {
  var group_to_values = dataJSON.reduce(function (obj, respondent) {
    obj[respondent.country] = obj[respondent.country] || [];
    obj[respondent.country].push(respondent);
    return obj;
  }, {});

  var groups = Object.keys(group_to_values).map(function (key) {
    return {country: key, respondents: group_to_values[key]};
  });

  var group_by_country = groups.filter(group => group.respondents.length >= 1000)

  group_by_country.forEach(country => {
    var respondents = country.respondents

    const objChildren = {
      name: country.country,
      children: []
    }

    // start here for professional
    var group_to_values = respondents.reduce(function (obj, respondent) {
      obj[respondent.professional] = obj[respondent.professional] || [];
      obj[respondent.professional].push(respondent);
      return obj;
    }, {});
    
    var groupsProfessional = Object.keys(group_to_values).map(function (key) {
      return {name: key, size: group_to_values[key].length};
    });

    const objProfessional = {
      name: "Professional",
      children: groupsProfessional
    }
    // end of group of professional

    // start here for program hobby
    var group_to_values = respondents.reduce(function (obj, respondent) {
      obj[respondent.programhobby] = obj[respondent.programhobby] || [];
      obj[respondent.programhobby].push(respondent);
      return obj;
    }, {});
    
    var groupsProgramHobby = Object.keys(group_to_values).map(function (key) {
      return {name: key, size: group_to_values[key].length};
    });

    const objProgramHobby = {
      name: "Program Hobby",
      children: groupsProgramHobby
    }
    // end of group of program hobby      

    // start here for employment status
    var group_to_values = respondents.reduce(function (obj, respondent) {
      obj[respondent.employmentstatus] = obj[respondent.employmentstatus] || [];
      obj[respondent.employmentstatus].push(respondent);
      return obj;
    }, {});
    
    var groupsEmploymentStatus = Object.keys(group_to_values).map(function (key) {
      return {name: key, size: group_to_values[key].length};
    });

    const objEmploymentStatus = {
      name: "Employment Status",
      children: groupsEmploymentStatus
    }
    // end of group of employment status   

    // start here for formaleducation
    var group_to_values = respondents.reduce(function (obj, respondent) {
      obj[respondent.formaleducation] = obj[respondent.formaleducation] || [];
      obj[respondent.formaleducation].push(respondent);
      return obj;
    }, {});
    
    var groupsFormalEducation = Object.keys(group_to_values).map(function (key) {
      return {name: key, size: group_to_values[key].length};
    });

    const objFormalEducation = {
      name: "Formal Education",
      children: groupsFormalEducation
    }
    // end of group of formaleducation

    objChildren.children.push(objProfessional)
    objChildren.children.push(objProgramHobby)
    objChildren.children.push(objEmploymentStatus)
    objChildren.children.push(objFormalEducation)
    surveyData.children.push(objChildren)
  })

  console.log("survey data,", surveyData)

  // start here
  surveyData = d3.hierarchy(surveyData)
                .sum(function(d) { return d.size; })
                .sort(function(a, b) { return b.value - a.value; });

  var focus = surveyData,
      nodes = pack(surveyData).descendants(),
      view;

  var circle = g.selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                  .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--surveyData"; })
                  .style("fill", function(d) { return d.children ? color(d.depth) : null; })
                  .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  var text = g.selectAll("text")
              .data(nodes)
              .enter().append("text")
                .attr("class", "label")
                .style("fill-opacity", function(d) { return d.parent === surveyData ? 1 : 0; })
                .style("display", function(d) { return d.parent === surveyData ? "inline" : "none"; })
                .text(function(d) { return d.data.name; });

  var node = g.selectAll("circle,text");

  svg
    .style("background", color(-1))
    .on("click", function() { zoom(surveyData); });

  zoomTo([surveyData.x, surveyData.y, surveyData.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
                      .duration(d3.event.altKey ? 7500 : 750)
                      .tween("zoom", function(d) {
                        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                        return function(t) { zoomTo(i(t)); };
                      });

    transition.selectAll("text")
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
  // end here
})