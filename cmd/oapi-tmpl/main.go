package main

import (
	"flag"
	"fmt"
	"github.com/Masterminds/sprig/v3"
	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	"github.com/pb33f/libopenapi"
	"github.com/pb33f/libopenapi-validator"
	"github.com/pb33f/libopenapi/datamodel/high/v3"
	"github.com/xuri/excelize/v2"
	"io"
	"log"
	"os"
	"text/template"
)

func loadFormatFile(formatPath string) (*excelize.File, error) {
	if formatPath == "" {
		return excelize.NewFile(), nil
	} else {
		return excelize.OpenFile(formatPath)
	}
}

func loadOpenAPISchema(oapiPath string) (*libopenapi.DocumentModel[v3.Document], error) {

	oapiBytes, err := os.ReadFile(oapiPath)
	if err != nil {
		return nil, err
	}

	doc, err := libopenapi.NewDocument(oapiBytes)
	if err != nil {
		return nil, err
	}

	docValidator, validatorErrs := validator.NewValidator(doc)

	if validatorErrs != nil {
		return nil, validatorErrs[0]
	}

	// 4. Validate!
	valid, validationErrs := docValidator.ValidateDocument()

	if !valid {
		for _, e := range validationErrs {
			// 5. Handle the error
			fmt.Printf("Type: %s, Failure: %s\n", e.ValidationType, e.Message)
			fmt.Printf("%d %d\n", e.SpecLine, e.SpecCol)
			fmt.Printf("%v\n", e)
			fmt.Printf("%v\n", e.SchemaValidationErrors)
			fmt.Printf("Fix: %s\n\n", e.HowToFix)
		}
	}

	v3Model, _ := doc.BuildV3Model()

	return v3Model, nil
}

/*
func setupTemplate(formatPath, oapiPath, templPath string) {
	funcMap := template.FuncMap{
		"set": format.SetCellValue,
	}
	templBytes, err := os.ReadFile(*templPath)
	tmpl, err := template.New("").Funcs(funcMap).Parse(string(templBytes))
	if err != nil {
		log.Fatalf("parsing: %s", err)
	}
}
*/

type Format struct {
	base *excelize.File
}

func (f *Format) Set(sheet string, pos []interface{}, vals []interface{}) string {
	log.Println(f.base)
	for idx, p := range pos {
		err := f.base.SetCellValue(sheet, p.(string), vals[idx].(string))
		log.Println(err)
	}
	return "a"
}

func main() {

	formatPath := flag.String("format", "", "output base file")
	oapiPath := flag.String("oapi", "spec.yaml", "openapi spec yaml file")
	templPath := flag.String("templ", "template.js", "template file (javascript)")
	flag.Parse()

	baseFormat, err := loadFormatFile(*formatPath)
	defer baseFormat.Close()
	if err != nil {
		log.Fatalln(err)
	}
	format := Format{base: baseFormat}
	log.Println(baseFormat)

	oapi, err := loadOpenAPISchema(*oapiPath)
	if err != nil {
		log.Fatalln(err)
	}

	registry := new(require.Registry)
	vm := goja.New()
	registry.Enable(vm)
	console.Enable(vm)

	vm.Set("doc", oapi)
	vm.Set("set", format.Set)
	vm.Set("offset", Offset)

	templBytes, err := os.ReadFile(*templPath)
	if err != nil {
		log.Fatalln(err)
	}

	vm.RunString(string(templBytes))

	funcMap := sprig.FuncMap()
	funcMap["set"] = format.Set

	tmpl, err := template.New("").Funcs(funcMap).Parse(string(templBytes))
	if err != nil {
		log.Fatalf("parsing: %s", err)
	}

	err = tmpl.Execute(io.Discard, oapi)
	if err != nil {
		log.Fatalln(err)
	}

	err = tmpl.Execute(os.Stdout, oapi)
	if err != nil {
		log.Fatalln(err)
	}

	format.base.SaveAs("out.xlsx")

	// log.Println(doc.Components.Schemas["ExampleObject"].Value.Properties)
}

func Offset(coords []string, axis int, offset int) ([]string, error) {
	var result []string
	for _, coord := range coords {
		col, row, err := excelize.CellNameToCoordinates(coord)
		if err != nil {
			return nil, err
		}

		if axis == 0 {
			coord, err := excelize.CoordinatesToCellName(col+offset, row)
			if err != nil {
				return nil, err
			}
			result = append(result, coord)
		} else {
			coord, err := excelize.CoordinatesToCellName(col, row+offset)
			if err != nil {
				return nil, err
			}
			result = append(result, coord)
		}
	}

	return result, nil
}
