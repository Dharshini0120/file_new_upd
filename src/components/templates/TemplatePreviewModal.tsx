import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Drawer } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableViewIcon from '@mui/icons-material/TableView';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

// Import the node components used in your questionnaire builder
import TemplateQuestionNode from './TemplateQuestionNode';
import TemplateEditQuestionNode from './TemplateEditQuestionNode';

// Table View Component
const TableView: React.FC<{ nodes: any[], edges: any[] }> = ({ nodes, edges }) => {
    // Create a mapping of option-specific connections
    const getOptionConnections = (nodeId: string) => {
        const nodeEdges = edges.filter(edge => edge.source === nodeId);
        const connections = {};

        nodeEdges.forEach(edge => {
            const optionText = edge.data?.optionText || edge.label || 'Default';
            const targetNode = nodes.find(n => n.id === edge.target);

            // Find the target question number by its position in the nodes array
            let targetQuestionNumber = null;
            if (targetNode) {
                targetQuestionNumber = nodes.findIndex(n => n.id === edge.target) + 1;
            }

            connections[optionText] = {
                targetQuestion: targetNode?.data?.question || 'Unknown Question',
                targetNumber: targetQuestionNumber,
                targetNode: targetNode,
                isEndAction: !targetNode,
                hasConnection: !!targetNode
            };
        });

        return connections;
    };



    return (
        <Box sx={{
            height: '100%',
            overflow: 'auto',
            backgroundColor: '#f5f7fa'
        }}>
            {/* Table Header */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '12px 16px',
                position: 'sticky',
                top: 0,
                zIndex: 1
            }}>
                <Box sx={{ padding: '16px' }}>S.No</Box>
                <Box sx={{ padding: '16px' }}>Question</Box>
            </Box>

            {/* Table Rows */}
            {nodes.map((node, index) => {
                const optionConnections = getOptionConnections(node.id);
                const hasOptions = ['multiple-choice', 'checkbox', 'radio', 'select', 'yes-no'].includes(node.data.questionType);

                return (
                    <Box key={node.id} sx={{
                        borderBottom: '1px solid #e1e8ed',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafe',
                    }}>
                        {/* Main Question Row */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr',
                            minHeight: '60px'
                        }}>
                            {/* Question Number */}
                            <Box sx={{
                                padding: '16px',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                color: '#2c3e50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#e3f2fd'
                            }}>
                                {index + 1}
                            </Box>

                            {/* Question */}
                            <Box sx={{ padding: '16px' }}>
                                <Typography sx={{
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    color: '#2c3e50',
                                    lineHeight: 1.4
                                }}>
                                    {node.data.question || 'Untitled Question'}
                                </Typography>

                                {/* Show options with S.No and responses inline */}
                                {hasOptions && (
                                    <Box sx={{ marginTop: '12px' }}>
                                        {node.data.questionType === 'yes-no' ? (
                                            // For yes-no questions, show Yes and No options with responses
                                            ['Yes', 'No'].map((option: string, optIndex: number) => {
                                                const connection = optionConnections[option];
                                                let responseText = 'Refer to Consultant';

                                                if (connection && connection.hasConnection && connection.targetNumber) {
                                                    responseText = `Move to Q${connection.targetNumber}`;
                                                }

                                                return (
                                                    <Box key={optIndex} sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                        fontSize: '14px',
                                                        color: '#333'
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{
                                                                minWidth: '20px',
                                                                fontWeight: 'bold',
                                                                marginRight: '8px'
                                                            }}>
                                                                {optIndex + 1}.
                                                            </Box>
                                                            <Box>{option}</Box>
                                                        </Box>
                                                        <Box sx={{
                                                            fontWeight: '500',
                                                            color: responseText.includes('Move to') ? '#2196f3' : '#ff5722'
                                                        }}>
                                                            {responseText}
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        ) : (
                                            // For other question types with options and responses
                                            node.data.options?.map((option: string, optIndex: number) => {
                                                const connection = optionConnections[option];
                                                let responseText = 'Refer to Consultant';

                                                if (connection && connection.hasConnection && connection.targetNumber) {
                                                    responseText = `Move to Q${connection.targetNumber}`;
                                                }

                                                return (
                                                    <Box key={optIndex} sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                        fontSize: '14px',
                                                        color: '#333'
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{
                                                                minWidth: '20px',
                                                                fontWeight: 'bold',
                                                                marginRight: '8px'
                                                            }}>
                                                                {optIndex + 1}.
                                                            </Box>
                                                            <Box>{option}</Box>
                                                        </Box>
                                                        <Box sx={{
                                                            fontWeight: '500',
                                                            color: responseText.includes('Move to') ? '#2196f3' : '#ff5722'
                                                        }}>
                                                            {responseText}
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        )}
                                    </Box>
                                )}

                                {/* Show Text Input for questions without options */}
                                {!hasOptions && (
                                    <Box sx={{
                                        marginTop: '12px',
                                        padding: '8px 14px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#6c757d',
                                        border: '1px solid #dee2e6',
                                        display: 'inline-block'
                                    }}>
                                        Text Input
                                    </Box>
                                )}
                            </Box>


                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};

const nodeTypes = {
    questionNode: TemplateQuestionNode,
    editQuestionNode: TemplateEditQuestionNode
};

interface TemplatePreviewModalProps {
    template: any;
    onClose: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
    template,
    onClose
}) => {
    const [viewMode, setViewMode] = useState<'node' | 'table'>('node');

    //console.log('🔍 Preview Modal - Template data:', template);
    //console.log('🔍 Preview Modal - Nodes:', template?.nodes);
    //console.log('🔍 Preview Modal - Edges:', template?.edges);

    // Prepare nodes for preview (remove interactive handlers)
    const previewNodes = (template?.nodes || []).map(node => ({
        ...node,
        data: {
            ...node.data,
            // Remove interactive handlers for preview
            onUpdate: undefined,
            onDelete: undefined,
            onUpdateEdgeLabels: undefined,
            isPreview: true // Add flag to indicate preview mode
        }
    }));

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000
            }}
        >
            <Box
                sx={{
                    background: 'white',
                    borderRadius: '12px',
                    width: '90vw',
                    height: '80vh',
                    overflow: 'hidden',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 3,
                        py: 2.5,
                        backgroundColor: '#4baaf4',
                        borderRadius: '12px 12px 0 0'
                    }}
                >
                    <Typography sx={{
                        fontWeight: 600,
                        color: 'white',
                        fontSize: '18px'
                    }}>
                        {template?.templateName || template?.name || 'Untitled Template'}
                    </Typography>

                    {/* View Toggle and Close Icons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Node View">
                            <IconButton
                                onClick={() => setViewMode('node')}
                                sx={{
                                    color: 'white',
                                    backgroundColor: viewMode === 'node' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <AccountTreeIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Table View">
                            <IconButton
                                onClick={() => setViewMode('table')}
                                sx={{
                                    color: 'white',
                                    backgroundColor: viewMode === 'table' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <TableViewIcon />
                            </IconButton>
                        </Tooltip>

                        <IconButton
                            onClick={onClose}
                            sx={{
                                color: 'white',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Content Area */}
                <Box sx={{
                    height: 'calc(80vh - 80px)',
                    width: '100%'
                }}>
                    {viewMode === 'node' ? (
                        /* Flow Chart View */
                        <ReactFlow
                            nodes={previewNodes}
                            edges={template?.edges || []}
                            nodeTypes={nodeTypes}
                            fitView
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            fitViewOptions={{
                                padding: 0.1,
                                minZoom: 0.1,
                                maxZoom: 2
                            }}
                            defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
                        >
                            <Controls />
                            <MiniMap />
                            <Background variant={"dot" as any} gap={12} size={1} />
                        </ReactFlow>
                    ) : (
                        /* Table View */
                        <TableView
                            nodes={previewNodes}
                            edges={template?.edges || []}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default TemplatePreviewModal;

