const express = require('express')
const router = express.Router()

const Car=require('../models/Car');
const Manufacturer=require('../models/Manufacturer');
const Car_manufacturer=require('../models/Car_manufacturer');
const axios=require('axios');
const jwt=require('jsonwebtoken');
const Joi = require('joi').extend(require('@joi/date'))

const JWT_KEY = 'SOAcars'

//Kevin
router.get("/:vin?",async(req,res)=>{
    let vin=req.query.vin
    if (vin!=null) {
        let car=await Car.findByPk(vin);
        if (!car) {
            return res.status(404).send("car not found")
        }
        return res.status(200).send(car);
    }else{
        return res.status(200).send(await Car.findAll());
    }
})
//Kevin
router.post("/manufacturer/new",async(req,res)=>{
    let inputs={...req.body};
    let id_manufacturer="";
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(403).send({"messsage":'Authentication Required'})
    }
    try {
        let userdata = jwt.verify(token, JWT_KEY)
        if (userdata.role!=3) {
            return res.status(403).send({"messasge":"Unauthorized Access"});
        }
        id_manufacturer=userdata.idx;
    } catch (error) {
        return res.status(403).send({"message":'Invalid JWT Key'})
    }
    let manufacturer_data=await Manufacturer.findByPk(id_manufacturer);
    if (manufacturer_data.authorized==0) {
        return res.status(403).send("Cannot post request,this user needs admin's approval.");
    }
    if (typeof inputs === 'object' && inputs !== null && Object.keys(inputs).length > 0) {
        let {model,manufacturer,fuel_type,drive,cylinders,transmission,year}='';
        if (inputs.model!=null) {
            model=inputs.model
        }
        if (inputs.manufacturer!=null) {
            manufacturer=inputs.manufacturer
        }
        if (inputs.fuel_type!=null) {
            fuel_type=inputs.fuel_type
        }
        if (inputs.drive!=null) {
            drive=inputs.drive
        }
        if (inputs.cylinders!=null) {
            cylinders=inputs.cylinders
        }
        if (inputs.transmission!=null) {
            transmission=inputs.transmission
        }
        if (inputs.year!=null) {
            year=inputs.year
        }
        let api_car=await axios.get('https://api.api-ninjas.com/v1/cars', {
            params: {
            'model': inputs.model,
            'make': inputs.manufacturer,
            'fuel_type': inputs.fuel_type,
            'drive': inputs.drive,
            'cylinders': inputs.cylinders,
            'transmission': inputs.transmission,
            'year': inputs.year,
            'limit':'1'
            },
            headers: {
            'accept': 'application/json',
            'X-Api-Key': 'Ir0NxLEnYpbDUmRS756CSg==g8eQQm0Cl53jqHnZ'
            }
        });
        
        if (api_car.data.length==0) {
            return res.status(404).send("car not found");
        }else{
            let insert=await Car_manufacturer.create({
                model:api_car.data[0].model,
                idx_manufacturer:id_manufacturer,
                fuel_type:api_car.data[0].fuel_type,
                year:api_car.data[0].year,
                drive:api_car.data[0].drive,
                transmission:api_car.data[0].transmission,
                cylinders:api_car.data[0].cylinders,
            });

            return res.status(200).send(insert);
        }

    }else{
        return res.status(400).send("please fill a paramater (model/manufacturer/fuel_type/drive/cylinders/transmission/year)");
    }

});

//Kevin
router.post("/manufacturer/add",async(req,res)=>{
    let inputs={...req.body};
    let id_manufacturer="";
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(403).send({"messsage":'Authentication Required'})
    }
    try {
        let userdata = jwt.verify(token, JWT_KEY)
        if (userdata.role!=3) {
            return res.status(403).send({"messasge":"Unauthorized Access"});
        }
        id_manufacturer=userdata.idx;
    } catch (error) {
        return res.status(403).send({"message":'Invalid JWT Key'})
    }
    let manufacturer_data=await Manufacturer.findByPk(id_manufacturer);
    if (manufacturer_data.authorized==0) {
        return res.status(403).send("Cannot post request,this user needs admin's approval.");
    }

    const schema=Joi.object({
        car_model:Joi.string().required(),
        vehicle_code:Joi.string().required().min(5).max(5),
        security_check_digit:Joi.string().required(),
        quantity:Joi.number().required(),
    });
    try {
        await schema.validateAsync(req.body)
    } catch (error) {
        return res.status(400).send(error.message);
    }
    let car_data=await Car_manufacturer.findOne({where:{
        model:inputs.car_model
    }});
    if (!car_data) {
        return res.status(404).send("car model not found");
    }
    let cars=[];
    for (let i = 0; i < inputs.quantity; i++) {
        let num=1;
        let vin_number_front=manufacturer_data.region_id+(manufacturer_data.name.substring(0,2)).toUpperCase()+inputs.vehicle_code+inputs.security_check_digit+getYearCode(car_data.year)+manufacturer_data.plant_code
        let get_existing_cars=await Car.findAll({where:{
            idx_car_manufacturer:car_data.idx
        }})
        num=num+get_existing_cars.length;
        let vin_number=vin_number_front+num.toString().padStart(5,'0')
        let insert=await Car.create({
            vin:vin_number,
            idx_car_manufacturer:car_data.idx
        }) 
        cars.push(insert);
    }
    let display={
        message:"insert car/cars successful",
        cars
    }
    return res.status(200).send(display);
});

//update
router.put("/:vin",async(req,res)=>{

})
//delete
router.put("/:vin",async(req,res)=>{

})
module.exports = router



function getYearCode(year) {
    var table = {
        '1980': 'A', '1981': 'B', '1982': 'C', '1983': 'D', '1984': 'E', '1985': 'F', '1986': 'G', '1987': 'H', '1988': 'J', '1989': 'K',
    '1990': 'L', '1991': 'M', '1992': 'N', '1993': 'P', '1994': 'R', '1995': 'S', '1996': 'T', '1997': 'V', '1998': 'W', '1999': 'X',
    '2000': 'Y', '2001': '1', '2002': '2', '2003': '3', '2004': '4', '2005': '5', '2006': '6', '2007': '7', '2008': '8', '2009': '9',
    '2010': 'A', '2011': 'B', '2012': 'C', '2013': 'D', '2014': 'E', '2015': 'F', '2016': 'G', '2017': 'H', '2018': 'J', '2019': 'K',
    '2020': 'L', '2021': 'M', '2022': 'N', '2023': 'P', '2024': 'R', '2025': 'S', '2026': 'T', '2027': 'V', '2028': 'W', '2029': 'X',
    '2030': 'Y', '2031': '1', '2032': '2', '2033': '3', '2034': '4', '2035': '5', '2036': '6', '2037': '7', '2038': '8', '2039': '9'
    };
    return table[year] || 'Invalid year';
}
