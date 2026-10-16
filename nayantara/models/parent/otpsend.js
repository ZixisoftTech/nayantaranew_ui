const multer = require('multer');
const dataBase = require('../../config/db');

const fileStorage = multer.diskStorage({
    destination: (req, res, cb) => {
        try {
            cb(null, "uploads")
        } catch (e) {
            cb(e, false)
        }
    }, filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const Upload = multer({
    storage: fileStorage,
}).single("image")


const getAvailablemin = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            const { id } = req.body;
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not be use" });
            }
            else {
                dataBase.query('SELECT * From tbl_parents WHERE id = ?', [id], function (error, results, fields) {
                    if (results == 0) {
                        return res.status(401).send({ error: true, message: "Parent not found", data: null });
                    }
                    else {
                        const secTime = results[0].total_talktime;
                        const computeMinutes = Math.floor(secTime / 60);
                        const sec = secTime % 60;
                        // Convert minutes and seconds to strings with leading zeros if necessary
                        const minutesString = String(computeMinutes).padStart(2, '0');
                        const secondsString = String(sec).padStart(2, '0');

                        const minutes = minutesString + ':' + secondsString;
                        results[0].minutes = minutes;
                        return res.status(200).send({ error: false, message: "parent Successfuly get min", data: results[0] });
                    }
                })
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Get availble min api not working" });
    }
}

const getSubscription = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(201).send({ error: true, message: "getsubscription multer not working" });
            }
            else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(402).send({ error: true, message: "Please insert franchise_id" });
                }
                else {
                    dataBase.query('SELECT tbl_subscriptions.*,(tbl_subscriptions.talktime_minutes/60) as talk_time From tbl_subscriptions WHERE franchise_id = ?', [id], function (error, getsubscription, results) {
                        if (getsubscription == 0) {
                            return res.status(402).send({ error: true, message: "subscriptions not found", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "subscriptions successfully found", data: getsubscription });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Internal server getsubscription api not working" });
    }
}

const buySubscription = (req, res, next) => {
    try {
        Upload(req, res, (error) => {
            if (error) {
                return res.status(402).send({ error: true, message: "Multer not we use" });
            } else {
                const { id, studentid, planid } = req.body;
                if (id == 0 || studentid == 0 || planid == 0) {
                    return res.status(201).send({ error: true, message: "Please insert id,studentid,planid" });
                } else {
                    dataBase.query('SELECT * From tbl_subscriptions WHERE id = ?', [planid], function (error, findSubscription, fields) {
                        if (findSubscription == 0) {
                            return res.status(202).send({ error: true, message: "Subscription not approved this moment", data: null });
                        } else {
                            const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                            var now = new Date();
                            var day = weekend[now.getDay()];
                            const sql = 'INSERT INTO tbl_plan_purchase (plan_id,plan_name,plan_price,plan_min,parent_id,student_id,day) VALUES (?)';
                            const VALUES = [findSubscription[0].id, findSubscription[0].plan_name, findSubscription[0].price, findSubscription[0].talktime_minutes, id, studentid, day];
                            dataBase.query(sql, [VALUES], function (error, palnBuy, fields) {
                                if (palnBuy == 0) {
                                    return res.status(401).send({ error: true, message: "data not be insert", data: null });
                                } else {
                                    dataBase.query('SELECT * From tbl_parents WHERE student_id = ?', [studentid], function (error, parentfind, fields) {
                                        if (parentfind == 0) {
                                            return res.status(400).send({ error: true, message: "Parents not found", data: null });
                                        }
                                        else {
                                            var total_talktime = Number(parentfind[0].total_talktime)
                                            var talktime_minutes = Number(findSubscription[0].talktime_minutes);
                                            var minutes = total_talktime + talktime_minutes;
                                            const sql = "UPDATE `tbl_parents` SET `total_talktime`=? WHERE `id`='" + id + "'";
                                            const value = [minutes];
                                            dataBase.query(sql, [value], function (error, parentsplan, fields) {
                                                if (parentsplan) {
                                                    dataBase.query('SELECT * From tbl_student WHERE id = ?', [studentid], function (error, studentfind, fields) {
                                                        if (studentfind == 0) {
                                                            return res.status(400).send({ error: true, message: "Student not found", data: null });
                                                        } else {
                                                            var total_talktime = Number(studentfind[0].total_talktime);
                                                            var talktime_minutes = Number(findSubscription[0].talktime_minutes);
                                                            const minutes = (total_talktime + talktime_minutes);
                                                            const sql = "UPDATE `tbl_student` SET `total_talktime`=? WHERE `id`='" + studentid + "'";
                                                            const value = [minutes];
                                                            dataBase.query(sql, [value], function (error, studentPlan, fields) {
                                                                if (studentPlan) {
                                                                    return res.status(200).send({ error: false, message: "Student talktime minute successfuly Update" });
                                                                } else {
                                                                    return res.status(400).send({ error: true, message: "Student talktime minute not successfuly Update" });
                                                                }
                                                            })
                                                        }
                                                    })
                                                } else {
                                                    return res.status(400).send({ error: true, message: "Parent talktime minute not successfuly Update" })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "BuySubscription api not working" });
    }
}

const getTarnsition = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(202).send({ error: true, message: "Multer not working" });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(202).send({ error: true, message: "Please insert parent id", data: null });
                } else {
                    dataBase.query('SELECT tbl_plan_purchase. id,plan_id,parent_id,student_id,plan_name,plan_price,(tbl_plan_purchase.plan_min/60) as plan_min,day,DATE_FORMAT(created_at, "%Y-%m-%d") as date,TIME_FORMAT(created_at,"%h:%i:%s") as time,updated_at From tbl_plan_purchase WHERE parent_id = ?', [id], function (error, transition, fields) {
                        if (transition == 0) {
                            return res.status(401).send({ error: true, message: "Parent transition not found", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "Parent Transition successfuly get", data: transition });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "getTransition api not wprking" });
    }
}

// const parentHistory = (req, res, next) => {
//     try {
//         Upload(req, res, (err) => {
//             if (err) {
//                 return res.status(401).send({ error: true, message: "Multer not be working" });
//             }
//             else {
//                 const { id, status, availablemin } = req.body;
//                 if (id == 0 || status == 0) {
//                     return res.status(402).send({ error: true, message: "Please insert id, status or another status" });
//                 }
//                 else {
//                     if (status == 3) {
//                         if (availablemin != 0) {
//                             dataBase.query('UPDATE tbl_callhistory SET status = ?,minute = ? WHERE id = ?', [status, availablemin, id], function (error, updatemin, fields) {
//                                 if (availablemin) {
//                                     return res.status(200).send({ error: false, message: "status and minute successfully update", data: availablemin });
//                                 }
//                                 else {
//                                     return res.status(401).send({ error: true, message: "status and minute not successfully update" });
//                                 }
//                             })
//                         } else {
//                             return res.status(201).send({ error: true, message: "Please insert available min" })
//                         }
//                     }
//                     else {
//                         dataBase.query('UPDATE tbl_callhistory SET status = ? WHERE id = ?', [status, id], function (error, update, fields) {
//                             if (update) {
//                                 return res.status(401).send({ error: false, message: "Call history status update", data: update });
//                             }
//                             else {
//                                 return res.status(402).send({ error: true, message: "call history status not be update" });
//                             }
//                         })
//                     }
//                 }
//             }
//         })
//     }
//     catch (error) {
//         return res.status(401).send({ error: true, message: "Parent history api not working" });
//     }
// }

const callhistory = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not working" });
            }
            else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(202).send({ error: true, message: "Please insert student id" });
                }
                else {
                    dataBase.query('SELECT id,student_id,student_name,parent_id,parent_name,CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) AS `minute`,updated_at,DATE_FORMAT(created_at, "%Y-%m-%d") as date,TIME_FORMAT(created_at,"%h:%i:%s") as time From tbl_callhistory WHERE parent_id = ?', [id], function (error, results, fields) {
                        if (results == 0) {
                            return res.status(202).send({ error: true, message: "Parent call history not successfully get", data: null });
                        }
                        else {
                            return res.status(200).send({ error: false, message: "Parent call history successfully get", data: results });

                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "" })
    }
}

// const updateParentStatus = (req, res, next) => {
//     try {
//         Upload(req, res, (err) => {
//             if (err) {
//                 return res.status(200).send({ error: true, message: "Multer not be working" });
//             }
//             else {
//                 const { meetinglink, status } = req.body;
//                 if (meetinglink == 0 || status == 0) {
//                     return res.status(200).send({ error: true, message: "Please insert meetinglink and status" });
//                 } else {
//                     dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = ?', [meetinglink], function (error, getStatus, fields) {
//                         if (getStatus == 0) {
//                             return res.status(200).send({ error: true, message: "Mettinglonk not found", data: null });
//                         }
//                         else {
//                             // if (status == 3) {
//                             //     return res.status(200).send({ error: true, message: "call already ended" });
//                             // } else {
//                             if (getStatus[0].status == 0) {
//                                 if (status == 1) {
//                                     // if (getStatus[0].status == 2) {
//                                     //     return res.status(200).send({ error: true, message: "call already accepted", data: null })
//                                     // } else {
//                                     //     if (status == 3) {
//                                     //         return res.status(200).send({ error: true, message: "not update status", data: null });
//                                     //     } 
//                                     //     else {
//                                             dataBase.query('UPDATE tbl_callhistory SET status = 3 WHERE meeting_link = ?', [meetinglink], function (error, updateStatus, fields) {
//                                                 if (updateStatus) {
//                                                     return res.status(200).send({ error: false, message: "Parent call accept", data: updateStatus });
//                                                 } else {
//                                                     return res.status(200).send({ error: true, message: "Parent call not accept", data: null });
//                                                 }
//                                             })
//                                     //     }
//                                     // }
//                                 } else {
//                                     dataBase.query('UPDATE tbl_callhistory SET status = ? WHERE meeting_link = ?', [status,meetinglink], function (error, callDefuse, fields) {
//                                         if (callDefuse) {
//                                             return res.status(200).send({ error: true, message: "call Defuse", data: null });
//                                         }
//                                     })
//                                 }
//                             } else {
//                                 dataBase.query('UPDATE tbl_callhistory SET status = ? WHERE meeting_link = ?', [status,meetinglink], function (error, callDefuse, fields) {
//                                     if (callDefuse) {
//                                         return res.status(200).send({ error: true, message: "call Defuse", data: null });
//                                     }
//                                 })
//                             }
//                         }
//                         //     }
//                     })
//                 }
//             }
//         })
//     }
//     catch (error) {
//         return res.status(400).send({ error: true, message: "Update Parent Status api not working" });
//     }
// }

const updateParentStatus = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "Multer not be working" });
            } else {
                const { meetinglink, status } = req.body;
                if (status == 0 || meetinglink == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the meetinglink and status", data: null });
                } else {
                    dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = "' + meetinglink + '"', function (error, findHistoryStatus, fields) {
                        if (findHistoryStatus[0].status == 0) {
                            if (status == 3) {
                                dataBase.query('UPDATE tbl_callhistory SET status = "' + status + '" WHERE meeting_link = "' + meetinglink + '"', function (error, updateDecline, fields) {
                                    if (updateDecline) {
                                        return res.status(200).send({ error: false, message: "parent call decline", data: null });
                                    }
                                })
                            } else {
                                if (status == 2) {
                                    dataBase.query('UPDATE tbl_callhistory SET status = "' + status + '" WHERE meeting_link = "' + meetinglink + '"', function (error, updateAccept, fields) {
                                        if (updateAccept) {
                                            return res.status(200).send({ error: false, message: "call accept", data: null });
                                        }
                                    })
                                } else {
                                    dataBase.query('UPDATE tbl_callhistory SET status = "3" WHERE meeting_link = "' + meetinglink + '"', function (error, updateCallInitaiteields) {
                                        if (updateCallInitaiteields) {
                                            return res.status(200).send({ error: false, message: "call automatic decline", data: null });
                                        }
                                    })
                                }
                            }
                        } else {
                            return res.status(200).send({ error: true, message: "parent allready get other response", data: null });
                        }
                    })
                }
            }
        })
    } catch (error) {
        return res.status(204).send({ error: true, message: "update parent status api not working", data: null })
    }
}

// const getStatusByParentId = (req, res, next) => {
//     try {
//         Upload(req, res, (err) => {
//             if (err) {
//                 return res.status(200).send({ error: true, message: "multer not be working" });
//             }
//             else {
//                 const { meetinglink } = req.body;
//                 const status = 0;
//                 if (meetinglink == 0) {
//                     return res.status(200).send({ error: true, message: "Please insert parent Id" });
//                 }
//                 else {
//                     dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = ?', [meetinglink], function (error, results, fields) {
//                         if(results == 0){
//                             return res.status(200).send({error: true,message:"Please insert correct meeting link", data: {status,results[0].name,results[0]}});
//                         }
//                         else{
//                             if (results[0].status == 2) {
//                                 return res.status(200).send({ error: false, message: "Parent not on call", data: results[0] });
//                             }
//                             else {
//                                 return res.status(200).send({ error: true, message: "Call not pick" });
//                             }
//                         }
//                     })
//                 }
//             }
//         })
//     }
//     catch (error) {
//         return res.status(400).send({ error: true, message: "get status by parentID api not working" });
//     }
// }

// const getStatusByParentId = (req, res, next) => {
//     try {
//         Upload(req, res, (err) => {
//             if (err) {
//                 return res.status(200).send({ error: true, message: "multer not be working" });
//             }
//             else{
//                 const {id} = req.body;
//                 if(id == 0){
//                     return res.status(200).send({error:true,message:"Please insert parent Id"});
//                 }
//                 else{
//                     var status = 2;
//                     dataBase.query('SELECT * from tbl_callhistory WHERE parent_id = "'+id+'" AND status = "'+status+'"',function(error,results,fields){
//                         if(results != 0){
//                             return res.status(200).send({error:true, message:"parents are ongoing",data: null});
//                         }
//                         else{
//                             dataBase.query('SELECT * from tbl_callhistory WHERE parent_id = "'+id+'"',function(error,parent,fields){
//                                 if(parent == 0){
//                                     return res.status(200).send({error:true, message:"parents are not login"});
//                                 }
//                                 else{
//                                     const results = {
//                                         id: null,
//                                         student_id: null,
//                                         student_name: parent[0].student_name,
//                                         parent_id: null,
//                                         parent_name: parent[0].parent_name,
//                                         meeting_link: null,
//                                         minute: null,
//                                         status: status = 0,
//                                         updated_at: null,
//                                         created_at: null

//                                     }
//                                     return res.status(200).send({error: true,message:"parent not the ongoing",data: results});
//                                 }
//                             })
//                         }
//                     })
//                 }
//             }
//         })
//     }
//     catch (error) {
//     return res.status(400).send({ error: true, message: "get status by parentID api not working" });
// }
// }

const getStatusByParentId = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "Multer errror" });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the id" });
                } else {
                    dataBase.query('SELECT tbl_student.id AS studentid,tbl_student.name AS studentname,tbl_student.status AS student_status,tbl_callhistory.meeting_link as meeting_link,tbl_callhistory.status as meeting_status FROM tbl_student LEFT JOIN tbl_parents ON tbl_parents.student_id = tbl_student.id LEFT JOIN tbl_callhistory ON tbl_callhistory.parent_id = tbl_parents.id WHERE tbl_parents.id = "' + id + '" ORDER BY tbl_callhistory.id DESC LIMIT 1', function (error, results, fields) {
                    // dataBase.query('SELECT tbl_student.id AS studentid,tbl_student.name AS studentname,tbl_student.status AS student_status,tbl_callhistory.meeting_link as meeting_link,tbl_callhistory.status as meeting_status,tbl_franchise.room_id as room_id FROM tbl_student LEFT JOIN tbl_parents ON tbl_parents.student_id = tbl_student.id LEFT JOIN tbl_callhistory ON tbl_callhistory.parent_id = tbl_parents.id LEFT JOIN tbl_franchise ON tbl_student.franchise_id = tbl_franchise.Id WHERE tbl_parents.id = "' + id + '" ORDER BY tbl_callhistory.id DESC LIMIT 1', function (error, results, fields) {
                    // dataBase.query('SELECT tbl_student.id AS studentid,tbl_student.name AS studentname,tbl_student.status AS student_status,tbl_callhistory.meeting_link as meeting_link,tbl_callhistory.status as meeting_status,CONCAT("nayantara_", tbl_parents.id) as room_id FROM tbl_student LEFT JOIN tbl_parents ON tbl_parents.student_id = tbl_student.id LEFT JOIN tbl_callhistory ON tbl_callhistory.parent_id = tbl_parents.id WHERE tbl_parents.id = "' + id + '" ORDER BY tbl_callhistory.id DESC LIMIT 1', function (error, results, fields) {
                        // dataBase.query('SELECT tbl_student.id AS studentid,tbl_student.name AS studentname,tbl_callhistory.meeting_link as meeting_link,tbl_callhistory.status as meeting_status,tbl_franchise.room_id as room_id FROM tbl_student LEFT JOIN tbl_parents ON tbl_parents.student_id = tbl_student.id LEFT JOIN tbl_callhistory ON tbl_callhistory.parent_id = tbl_parents.id LEFT JOIN tbl_franchise ON tbl_student.franchise_id = tbl_franchise.Id WHERE tbl_parents.id = "' + id + '" ORDER BY tbl_callhistory.id DESC LIMIT 1', function (error, results, fields) {
                        if (results == 0) {
                            return res.status(200).send({ error: true, message: "Results not found" });
                        }
                        else {
                            return res.status(200).send({ error: true, message: "results successfully found", data: results[0] });
                        }
                        // if (error) {
                        //     return res.status(200).send({ error: true, message: "Database query error" });
                        // }
                        // if (results.length == 0) {
                        //     return res.status(200).send({ error: true, message: "Results not found" });
                        // }else {
                        //     // return res.status(200).send({ error: true, message: "results successfully found", data: results[0] });
                        //     return res.status(200).send({ error: false, message: "results successfully found", data: results[0] });
                        // }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Api not working" });
    }
}

const getWebStatusByStudentId = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Student Id" });
        }
        else {
            dataBase.query('select * from tbl_callhistory WHERE student_id = "' + id + '" ORDER BY id DESC LIMIT 1', function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "Student Not Found" });
                }
                else {
                    return res.status(200).send({ error: false, message: "Student successfully found", data: results[0] });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Api not working" });
    }
}

const studentCallMinute = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(401).send({ error: true, message: "Call Minute multer not be working" });
            } else {
                const { id } = req.body;
                const min = '2';
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the Id" });
                } else {
                    dataBase.query('SELECT * From tbl_parents WHERE id = ?', [id], function (error, minute, fields) {
                        if (minute == 0) {
                            return res.status(200).send({ error: true, message: "Parent not found", data: null });
                        } else {
                            const secTime = minute[0].total_talktime;
                            const computeMinutes = Math.floor(secTime / 60);
                            const sec = secTime % 60;
                            const time = computeMinutes + ':' + sec
                            if (time > min) {
                                return res.status(200).send({ error: false, message: "This is call minute", data: Number(min) });
                            } else {
                                if (computeMinutes < min) {
                                    return res.status(200).send({ error: false, message: "This is a student available min", data: Number(computeMinutes) });
                                } else {
                                    return res.status(200).send({ error: true, message: "call minute and available min are equal", data: Number(computeMinutes) })
                                }
                            }
                        }
                    })
                }
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "Call minute api not be working" });
    }
};

const parentIssue = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { id, subject, message, status } = req.body;
                if (id == 0 || subject == 0 || message == 0 || status == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the all fileds" });
                } else {
                    dataBase.query('SELECT * FROM tbl_parents WHERE id = "' + id + '"', function (error, findParents, fields) {
                        if (findParents == 0) {
                            return res.status(200).send({ error: true, message: "Parent not found", data: null });
                        } else {
                            const sql = 'INSERT INTO tbl_parents_issue (parent_id,parent_name,subject,message,status) VALUES (?)'
                            const Values = [id, findParents[0].name, subject, message, status];
                            dataBase.query(sql, [Values], function (error, insertIssue, fields) {
                                if (insertIssue == 0) {
                                    return res.status(200).send({ error: true, message: "Parent issue not insert", data: null });
                                } else {
                                    return res.status(200).send({ error: false, message: "Parent issue successfully insert", data: insertIssue });
                                }
                            })
                        }
                    })
                }
            } else {
                return res.status(200).send({ error: true, message: "Multer not be working" });
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "parentIssue api not working" });
    }
}

const parentCallEnd = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(400).send({ error: true, message: "Multer not working" });
            }
            else {
                const { meetinglink, availablemin, status } = req.body;
                if (meetinglink == 0 || availablemin == 0 || status == 0) {
                    return res.status(200).send({ error: true, message: "Please insert all field" });
                }
                else {
                    dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = ?', [meetinglink], function (error, callhistory, fileds) {
                        if (callhistory == 0) {
                            return res.status(200).send({ error: true, message: "Meetinglink not found", data: null });
                        }
                        else {
                            if (callhistory[0].status == 3) {
                                return res.status(200).send({ error: true, message: "Call already ended", data: null });
                            }
                            if (status == 3) {
                                // only the request that actually ends the call charges it (student and parent may both send end)
                                const sql = 'UPDATE `tbl_callhistory` SET `minute` = ?, `status` = ? WHERE `meeting_link` = ? AND `status` <> 3';
                                dataBase.query(sql, [availablemin, status, meetinglink], function (error, statusUpdate, fields) {
                                    if (statusUpdate && statusUpdate.affectedRows === 0) {
                                        return res.status(200).send({ error: true, message: "Call already ended", data: null });
                                    }
                                    if (statusUpdate) {
                                        dataBase.query('SELECT * From tbl_parents WHERE student_id = ?', [callhistory[0].student_id], function (error, parentfound, fields) {
                                            if (parentfound == 0) {
                                                return res.status(200).send({ error: true, message: "student not found in parent", data: null });
                                            }
                                            else {
                                                // never take a positive balance below 0; an already-negative balance is left as is
                                                dataBase.query('UPDATE tbl_parents SET total_talktime = IF(total_talktime > 0, GREATEST(total_talktime - ?, 0), total_talktime) WHERE student_id = ?', [Number(availablemin) || 0, callhistory[0].student_id], function (error, updatemin, fields) {
                                                    if (updatemin) {
                                                        dataBase.query('SELECT * FROM tbl_student WHERE id = "' + parentfound[0].student_id + '"', function (error, studentfound, results) {
                                                            if (studentfound == 0) {
                                                                return res.status(200).send({ error: true, message: "Student not found", data: null });
                                                            }
                                                            else {
                                                                dataBase.query('UPDATE tbl_student SET total_talktime = IF(total_talktime > 0, GREATEST(total_talktime - ?, 0), total_talktime) WHERE id = ?', [Number(availablemin) || 0, studentfound[0].id], function (error, Updatemin, fields) {
                                                                    if (Updatemin) {
                                                                        return res.status(200).send({ error: false, message: "Time Successfully update", data: null });
                                                                    }
                                                                    else {
                                                                        return res.status(200).send({ error: true, message: "Time not successfully update", data: null });
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        return res.status(200).send({ error: true, message: "meeting link not found", data: null });
                                    }
                                })
                            }
                            else {
                                return res.status(200).send({ error: true, message: "Please insert status 3" });
                            }
                            //                         }
                            //                     else {
                            //     return res.status(200).send({ error: true, message: "Parent not be call attend" });
                            // }
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Student call end api not working" });
    }
}

const callDefuse = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { meetinglink } = req.body;
                const status = 3;
                if (meetinglink == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the meeting link" });
                } else {
                    dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = "' + meetinglink + '"', function (error, findMeeting, fields) {
                        if (findMeeting == 0) {
                            return res.status(200).send({ error: true, message: "parent meeting link not found", data: null });
                        } else {
                            if (findMeeting[0].status == 0) {
                                dataBase.query('UPDATE tbl_callhistory SET status = "' + status + '" WHERE meeting_link = "' + meetinglink + '"', function (error, updateStatus, fields) {
                                    if (updateStatus) {
                                        return res.status(200).send({ error: false, message: "call defuse status successfully update", data: null });
                                    } else {
                                        return res.status(200).send({ error: true, message: "call defuse status not successfully update", data: null });
                                    }
                                })
                            } else {
                                return res.status(200).send({ error: true, message: "Call already pickup", data: null });
                            }
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(200).send({ error: true, message: "call defuse api not working" });
    }
}

const planPermision = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(400).send({ error: true, message: "Multer not be working" });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the Id" });
                } else {
                    dataBase.query('SELECT * From tbl_parents WHERE id ="' + id + '"', function (error, findStudent, fields) {
                        if (findStudent == 0) {
                            return res.status(200).send({ error: true, message: "Parent not found", data: null });
                        } else {
                            dataBase.query('SELECT id,by_plan_permision From tbl_franchise WHERE Id = "' + findStudent[0].franchise_id + '"', function (error, findFranchise, fields) {
                                if (findFranchise == 0) {
                                    return res.status(200).send({ error: true, message: "Parent franchise not found", data: null });
                                } else {
                                    return res.status(200).send({ error: false, message: "Parent franchise successfully found", data: findFranchise[0] });
                                }
                            })
                        }
                    })
                }
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "pla permision api not working" });
    }
}

// const getParentIssue = (req, res, next) => {
//     try {
//         dataBase.query('SELECT tbl_parents_issue.*, tbl_parents.name as parent_name from tbl_parents_issue left join tbl_parents ON tbl_parents.id = tbl_parents_issue.parent_id', function (error, getIssue, fields) {
//             if (getIssue == 0) {
//                 return res.status(200).send({ error: true, message: "parent issue not found", data: null });
//             } else {
//                 return res.status(200).send({ error: false, message: "parent issue successfully found", data: getIssue });
//             }
//         })
//     } catch (error) {
//         return res.status(200).send({ error: true, message: "get student issue api not working" });
//     }
// }


const getParentIssue = (request, response, next) => {

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_parents_issue.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `
     AND (parent_name LIKE '%${search_value}%' 
     OR subject LIKE '%${search_value}%' 
     OR message LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_parents_issue", function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_parents_issue WHERE 1 ${search_query}`, function (error, data) {

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_parents_issue.*, tbl_parents.contact FROM tbl_parents_issue LEFT JOIN tbl_parents ON tbl_parents_issue.parent_id = tbl_parents.id
            WHERE 1 ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {
                    data_arr.push({
                        '_ref': { parent: row.parent_id },
                        'index': index + 1,
                        'parent_name': row.parent_name,
                        'contact': row.contact,
                        'subject': row.subject,
                        'message': row.message,
                    });
                });

                var output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                response.json(output);

            });

        });

    });

};

const getParentByStudentId = (request, response, next) => {
    const id = request.query.id;
    const draw = request.query.draw;

    if (id == 0 || id == "") {
        var output = {
            'draw': draw,
            'iTotalRecords': 0,
            'iTotalDisplayRecords': 0,
            'aaData': []
        };
        return response.json(output);
    }

    const start = parseInt(request.query.start) || 0;
    const length = parseInt(request.query.length) || 10;
    const orderData = request.query.order || [];

    let column_name = 'tbl_parents.id';
    let column_sort_order = 'desc';

    if (orderData.length > 0) {
        const column_index = orderData[0].column;
        column_name = request.query.columns[column_index].data;
        column_sort_order = orderData[0].dir;
    }

    const search_value = request.query.search ? request.query.search.value : "";

    const search_query = `
        AND (name LIKE ? 
        OR contact LIKE ? 
        OR email LIKE ?)
    `;

    const search_params = [`%${search_value}%`, `%${search_value}%`, `%${search_value}%`];

    dataBase.query('SELECT COUNT(*) AS Total FROM tbl_parents WHERE student_id = ?', [id], function (error, data) {
        if (error) {
            console.error('Error fetching total records:', error);
            return response.status(500).json({ error: 'Database query error' });
        }

        const total_records = data[0].Total;

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_parents WHERE student_id = ? ${search_query}`, [id, ...search_params], function (error, data) {
            if (error) {
                console.error('Error fetching filtered records:', error);
                return response.status(500).json({ error: 'Database query error' });
            }

            const total_records_with_filter = data[0].Total;

            const query = `SELECT * FROM tbl_parents WHERE student_id = ? ${search_query} ORDER BY ${column_name} ${column_sort_order} 
                LIMIT ?, ?`;

            dataBase.query(query, [id, ...search_params, start, length], function (error, data) {
                if (error) {
                    console.error('Error fetching parent records:', error);
                    return response.status(500).json({ error: 'Database query error' });
                }

                const data_arr = data.map((row, index) => ({
                    '_ref': { name: 'parent', parent: row.id, student: row.student_id },
                    'index': start + index + 1,
                    'name': row.name,
                    'contact': row.contact,
                    'email': row.email,
                    'password': row.password,
                    'action': row.status == 1 ? `<button class="btn-success" onClick="parentLogout(${row.id})">Logout</button>` : ''
                }));

                const output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                response.json(output);
            });
        });
    });
};


const parentLogout = (req, res) => {
    try {
        const { id } = req.body;
        if (id == '') {
            return res.status(200).json({ error: true, message: "Please provide the id", data: null })
        } else {
            dataBase.query('UPDATE `tbl_parents` SET `status` = "0", `fcm_token` = NULL WHERE `id` = "' + id + '"', function (error, updateStatus) {
                if (error) {
                    return res.status(200).send({ error: true, message: `${error}`, data: null });
                }
                if (updateStatus.affectedRows > 0) {
                    return res.status(200).send({ error: false, message: "Successfully Logout", data: updateStatus });
                } else {
                    return res.status(200).send({ error: true, message: "Not Logout", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error", data: null });
    }
};

module.exports = { getAvailablemin, getSubscription, buySubscription, getTarnsition, callhistory, updateParentStatus, getStatusByParentId, getWebStatusByStudentId, studentCallMinute, parentIssue, parentCallEnd, callDefuse, planPermision, getParentIssue, getParentByStudentId, parentLogout };