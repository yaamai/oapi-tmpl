package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	"github.com/pb33f/libopenapi"
	"github.com/pb33f/libopenapi-validator"
	highbase "github.com/pb33f/libopenapi/datamodel/high/base"
	highv3 "github.com/pb33f/libopenapi/datamodel/high/v3"
	low "github.com/pb33f/libopenapi/datamodel/low"
	lowbase "github.com/pb33f/libopenapi/datamodel/low/base"
	"github.com/xuri/excelize/v2"
	"gopkg.in/yaml.v3"
	"log"
	"os"
)

func loadYaml(data string) (interface{}, error) {
	var out interface{}

	err := yaml.Unmarshal([]byte(data), &out)
	if err != nil {
		return nil, err
	}

	return out, nil
}

func loadJsonSchema(data string) (*highbase.Schema, error) {
	var node yaml.Node
	err := yaml.Unmarshal([]byte(data), &node)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	var lowSchema lowbase.Schema
	err = low.BuildModel(node.Content[0], &lowSchema)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	err = lowSchema.Build(context.Background(), node.Content[0], nil)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	return highbase.NewSchema(&lowSchema), nil
}

func loadOpenAPISchema(data string) (*libopenapi.DocumentModel[highv3.Document], []error) {

	doc, err := libopenapi.NewDocument([]byte(data))
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
			for _, err := range e.SchemaValidationErrors {
				errs = append(errs, err)
			}
		}

		return nil, errs
	}

	v3Model, _ := doc.BuildV3Model()
	return v3Model, nil
}

func loadFile(path string) (string, error) {
	// goja maybe lacking ArrayBuffer.
	data, err := os.ReadFile(path)
	return string(data), err
}

func loadExcelFile(path string) (*excelize.File, error) {
	if path == "" {
		return excelize.NewFile(), nil
	} else {
		return excelize.OpenFile(path)
	}
}

func newStyleFromCell(book *excelize.File, sheet string, coord string, alignment map[string]interface{}) (int, error) {
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
}

func removeRow(book *excelize.File, sheet string, row int) {
	book.RemoveRow(sheet, row)
}

func setPrintArea(book *excelize.File, name string, sheet string, area string) {
	if err := book.SetDefinedName(&excelize.DefinedName{
	    Name:     name,
	    RefersTo: area,
	    Scope:    sheet,
	}); err != nil {
	    fmt.Println(err)
	}
}

func runTemplate(templPath string) {
	vm := goja.New()
	vm.Set("args", func() []string { return os.Args[2:] })
	vm.Set("print", fmt.Print)
	vm.Set("file", loadFile)
	vm.Set("yaml", loadYaml)
	vm.Set("jsonschema", loadJsonSchema)
	vm.Set("openapischema", loadOpenAPISchema)
	vm.Set("excelfile", loadExcelFile)
	vm.Set("excelize", map[string]interface{}{
		"cellNameToCoordinates": excelize.CellNameToCoordinates,
		"coordinatesToCellName": excelize.CoordinatesToCellName,
		"newStyleFromCell":      newStyleFromCell,
		"removeRow": removeRow,
		"setPrintArea": setPrintArea,
	})

	registry := new(require.Registry)
	registry.Enable(vm)
	console.Enable(vm)

	templBytes, err := os.ReadFile(templPath)
	if err != nil {
		log.Fatalln(err)
	}

	_, err = vm.RunString(string(templBytes))
	if err != nil {
		log.Fatalln(err)
	}
}

func main() {
	if len(os.Args) < 1 {
		return
	}
	templPath := os.Args[1]
	runTemplate(templPath)
}
