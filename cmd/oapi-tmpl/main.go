package main

import (
	"encoding/json"
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

func loadOpenAPISchema(oapiPath string) (*libopenapi.DocumentModel[v3.Document], []error) {

	oapiBytes, err := os.ReadFile(oapiPath)
	if err != nil {
		return nil, []error{err}
	}
	log.Println(string(oapiBytes[:128]))

	doc, err := libopenapi.NewDocument(oapiBytes)
	if err != nil {
		return nil, []error{err}
	}

	docValidator, validatorErrs := validator.NewValidator(doc)

	if validatorErrs != nil {
		return nil, validatorErrs
	}

	valid, validationErrs := docValidator.ValidateDocument()

	if !valid {
		var errs []error

		log.Println(len(validationErrs))
		for _, e := range validationErrs {
            log.Println("%v", e)

			for _, err := range e.SchemaValidationErrors {
				errs = append(errs, err)
			}
		}

		return nil, errs
	}

	v3Model, _ := doc.BuildV3Model()
	return v3Model, nil
}

func main() {

	formatPath := flag.String("format", "", "output base file")
	outputPath := flag.String("output", "out.xlsx", "output file")
	oapiPath := flag.String("oapi", "spec.yaml", "openapi spec yaml file")
	templPath := flag.String("templ", "template.js", "template file (javascript)")
	flag.Parse()

	format, err := loadFormatFile(*formatPath)
	defer format.Close()
	if err != nil {
		log.Fatalln(err)
	}

	oapi, errs := loadOpenAPISchema(*oapiPath)
	if errs != nil && len(errs) != 0 {
		for _, err := range errs {
			fmt.Println(err)
		}
		log.Fatalln("")
	}

	registry := new(require.Registry)
	vm := goja.New()
	registry.Enable(vm)
	console.Enable(vm)

	vm.Set("OpenApiDocument", oapi)
	vm.Set("OutputBook", format)

	vm.Set("CellNameToCoordinates", excelize.CellNameToCoordinates)
	vm.Set("CoordinatesToCellName", excelize.CoordinatesToCellName)
	vm.Set("CellNameToCoordinates", excelize.CellNameToCoordinates)
	vm.Set("NewStyleFromCell", func(book *excelize.File, sheet string, coord string, alignment map[string]interface{}) (int, error) {
		styleId, err := book.GetCellStyle(sheet, coord)
		if err != nil {
			return 0, err
		}

		style, err := book.GetStyle(styleId)
		if err != nil {
			return 0, err
		}

		bytes, err := json.Marshal(alignment)
		if err != nil {
			return 0, err
		}

		align := &excelize.Alignment{}
		err = json.Unmarshal(bytes, align)
		if err != nil {
			return 0, err
		}

		style.Alignment = align
		return book.NewStyle(style)
	})

	templBytes, err := os.ReadFile(*templPath)
	if err != nil {
		log.Fatalln(err)
	}

	_, err = vm.RunString(string(templBytes))
	if err != nil {
		log.Fatalln(err)
	}

	format.SaveAs(*outputPath)
}
