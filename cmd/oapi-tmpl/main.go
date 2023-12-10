package main

import (
	"flag"
	"fmt"
	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	"github.com/pb33f/libopenapi"
	"github.com/pb33f/libopenapi-validator"
	"github.com/pb33f/libopenapi/datamodel/high/v3"
	"github.com/xuri/excelize/v2"
	"log"
	"os"
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

type Format struct {
	base *excelize.File
}

func (f *Format) Set(sheet string, pos []interface{}, vals []interface{}) string {
	// log.Println(f.base)
	for idx, p := range pos {
		err := f.base.SetCellValue(sheet, p.(string), vals[idx].(string))
		if err != nil {
			log.Println(err)
		}
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
	// log.Println(baseFormat)

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
	vm.Set("offsets", Offset)

	templBytes, err := os.ReadFile(*templPath)
	if err != nil {
		log.Fatalln(err)
	}

	_, err = vm.RunString(string(templBytes))
	if err != nil {
		log.Fatalln(err)
	}

	format.base.SaveAs("out.xlsx")
}

func Offset(coords []string, axis int, offset int) []string {
	var result []string
	for _, coord := range coords {
		col, row, err := excelize.CellNameToCoordinates(coord)
		if err != nil {
			return nil
		}

		if axis == 0 {
			coord, err := excelize.CoordinatesToCellName(col+offset, row)
			if err != nil {
				return nil
			}
			result = append(result, coord)
		} else {
			coord, err := excelize.CoordinatesToCellName(col, row+offset)
			if err != nil {
				return nil
			}
			result = append(result, coord)
		}
	}

	return result
}
